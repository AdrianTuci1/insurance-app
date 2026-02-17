const pLimit = require('p-limit');
const s3Service = require('./s3.service');
const textractService = require('./textract.service');
const bedrockService = require('./bedrock.service');
const templateService = require('./template.service');
const Job = require('../models/job.model');
const ApiError = require('../utils/ApiError');
const IdGenerator = require('../utils/idGenerator');
const Logger = require('../utils/logger');
const { aggregatePolicyData } = require('../utils/policyUtils');
const { deduplicateOffers } = require('../utils/deduplicateData');

class PolicyService {
    constructor() {
        this.sseClients = new Map();
    }

    addSSEClient(jobId, res) {
        if (!this.sseClients.has(jobId)) {
            this.sseClients.set(jobId, []);
        }
        this.sseClients.get(jobId).push(res);
    }

    removeSSEClient(jobId, res) {
        const clients = this.sseClients.get(jobId);
        if (clients) {
            this.sseClients.set(jobId, clients.filter(c => c !== res));
        }
    }

    sendSSEEvent(jobId, data) {
        const clients = this.sseClients.get(jobId);
        if (clients) {
            clients.forEach(client => {
                client.write(`data: ${JSON.stringify(data)}\n\n`);
            });
        }
    }

    async startPolicyProcessing(files, type, userEmail) {
        if (!files || files.length === 0) {
            throw new ApiError(400, 'No files uploaded.');
        }

        const jobId = IdGenerator.generateId();
        const jobData = {
            jobId,
            userEmail,
            policyType: type || 'casco',
            status: 'not started',
            createdAt: new Date().toISOString(),
            filesCount: files.length,
            documents: files.map(f => ({
                originalName: f.originalname,
                key: f.key,
                status: 'pending',
                textractJobId: null
            }))
        };

        await Job.create(jobData);
        Logger.info(`[Job ${jobId}] Job created in DB. Starting background processing...`);

        // Start background processing
        this.processFilesInBackground(jobId, files, type || 'casco');

        return { jobId, status: 'processing', message: 'Processing started.' };
    }

    async processFilesInBackground(jobId, files, policyType) {
        try {
            Logger.info(`[Job ${jobId}] Starting background processing for ${files.length} files.`);

            Logger.info(`[Job ${jobId}] Updating status to 'in progress'...`);
            await Job.updateStatus(jobId, 'in progress');
            Logger.info(`[Job ${jobId}] Status updated. Sending SSE 'initializing'...`);
            this.sendSSEEvent(jobId, { status: 'in progress', stage: 'initializing', message: 'Starting processing pipeline...' });

            let promptTemplate;
            try {
                Logger.info(`[Job ${jobId}] Loading prompt template for ${policyType}...`);
                // Policy modules are in backend/policies (sibling to src), so ../../policies
                // Also ensure type is lowercase to match directory structure (casco vs CASCO)
                const policyModule = require(`../../policies/${policyType.toLowerCase()}/prompt`);
                promptTemplate = policyModule.PROMPT;
                Logger.info(`[Job ${jobId}] Prompt template loaded.`);
            } catch (err) {
                const errorMsg = `Invalid policy type: ${policyType} (path: ../../policies/${policyType.toLowerCase()}/prompt)`;
                Logger.error(`[Job ${jobId}] Error loading template:`, err);
                await Job.updateStatus(jobId, 'failed', { error: errorMsg });
                this.sendSSEEvent(jobId, { status: 'failed', error: errorMsg });
                return;
            }

            Logger.info(`[Job ${jobId}] Sending SSE 'textract_start'...`);
            this.sendSSEEvent(jobId, { status: 'in progress', stage: 'textract_start', message: 'Initiating document analysis...' });

            const startLimit = pLimit(10);
            const docStates = files.map(f => ({
                key: f.key,
                originalName: f.originalname,
                status: 'pending',
                textractJobId: null,
                data: null,
                error: null
            }));

            await Promise.all(docStates.map(doc => startLimit(async () => {
                try {
                    Logger.info(`[Job ${jobId}] Requesting Textract for: ${doc.originalName}`);
                    const tJobId = await textractService.startTextractJob(doc.key);
                    doc.textractJobId = tJobId;
                    doc.status = 'textract_started';
                    Logger.info(`[Job ${jobId}] Textract started for ${doc.originalName} (ID: ${tJobId})`);
                } catch (err) {
                    Logger.error(`[Job ${jobId}] Failed to start Textract for ${doc.originalName}:`, err);
                    doc.status = 'failed';
                    doc.error = err.message;
                }
            })));

            await Job.updateStatus(jobId, 'in progress', { documents: docStates });

            this.sendSSEEvent(jobId, { status: 'in progress', stage: 'analysis', message: 'Analyzing documents...' });

            const analyzeLimit = pLimit(5);
            let processedCount = 0;

            await Promise.all(docStates.map(doc => analyzeLimit(async () => {
                if (doc.status === 'failed') return;

                try {
                    const text = await textractService.waitForTextractJob(doc.textractJobId);
                    Logger.info(`[Job ${jobId}] Extracted ${text.length} chars from ${doc.originalName}. Sending to Bedrock...`);
                    const data = await bedrockService.extractDataWithBedrock(text, promptTemplate);
                    Logger.info(`[Job ${jobId}] processed ${doc.originalName} with Bedrock.`);

                    doc.status = 'analyzed';
                    doc.data = data;

                    processedCount++;
                    this.sendSSEEvent(jobId, {
                        status: 'in progress',
                        stage: 'processing',
                        progress: `${processedCount}/${files.length}`,
                        message: `Analyzed ${processedCount}/${files.length}: ${doc.originalName}`
                    });

                    if (processedCount % 3 === 0 || processedCount === files.length) {
                        await Job.updateStatus(jobId, 'in progress', { documents: docStates });
                    }
                } catch (err) {
                    doc.status = 'failed';
                    doc.error = err.message;
                }
            })));

            const validDocs = docStates.filter(d => d.status === 'analyzed' && d.data);

            if (validDocs.length === 0) {
                const errorMsg = 'Failed to extract data from any document.';
                await Job.updateStatus(jobId, 'failed', { error: errorMsg, documents: docStates });
                this.sendSSEEvent(jobId, { status: 'failed', error: errorMsg });
                return;
            }

            this.sendSSEEvent(jobId, { status: 'in progress', stage: 'aggregating', message: 'Aggregating results...' });

            const aggregatedData = aggregatePolicyData(validDocs, deduplicateOffers);

            await Job.updateStatus(jobId, 'complete', {
                extractedData: aggregatedData,
                documents: docStates
            });

            // Generate HTML for the completed policy
            const html = await templateService.renderTemplate(policyType, aggregatedData);

            this.sendSSEEvent(jobId, { status: 'complete', html, extractedData: aggregatedData });

        } catch (error) {
            console.error(`[Job ${jobId}] Fatal Error:`, error);

            try {
                // Cleanup on failure
                Logger.info(`[Job ${jobId}] Cleaning up failed job resources...`);

                // 1. Delete files from S3
                if (files && files.length > 0) {
                    await Promise.all(files.map(f => s3Service.deleteFile(f.key).catch(e => Logger.warn(`Failed to delete S3 file ${f.key}:`, e))));
                }

                // 2. Delete Job from DB
                await Job.delete(jobId);
                Logger.info(`[Job ${jobId}] Cleanup successful. Job deleted.`);

                this.sendSSEEvent(jobId, { status: 'failed', error: error.message, deleted: true });
            } catch (cleanupError) {
                Logger.error(`[Job ${jobId}] Cleanup failed:`, cleanupError);
                // Still try to update status if delete failed, though job might be gone or half-gone
                await Job.updateStatus(jobId, 'failed', { error: error.message });
                this.sendSSEEvent(jobId, { status: 'failed', error: error.message });
            }
        }
    }

    async getJobStatus(jobId) {
        const job = await Job.findById(jobId);
        if (!job) {
            throw new ApiError(404, 'Job not found');
        }
        return job;
    }

    async getPolicyHtml(jobId) {
        const job = await Job.findById(jobId);
        if (!job) {
            throw new ApiError(404, 'Job not found');
        }

        // Generate HTML on demand
        const data = job.extractedData || job.clientData || {};

        const safeData = {
            clientData: {},
            offersWithoutFranchise: [],
            offersWithFranchise: [],
            risks: '',
            notes: '',
            ...data
        };

        const html = await templateService.renderTemplate(job.policyType, safeData);
        return html;
    }

    async updatePolicyData(jobId, extractedData) {
        if (!extractedData) {
            throw new ApiError(400, 'Missing extractedData in request body.');
        }

        const job = await Job.findById(jobId);
        if (!job) {
            throw new ApiError(404, 'Job not found');
        }


        const safeData = {
            clientData: {},
            offersWithoutFranchise: [],
            offersWithFranchise: [],
            risks: '',
            notes: '',
            ...extractedData
        };

        const html = await templateService.renderTemplate(job.policyType, safeData);

        await Job.updateStatus(jobId, 'complete', {
            extractedData,
            updatedAt: new Date().toISOString()
        });

        return {
            success: true,
            message: 'Policy updated successfully',
            html,
            extractedData
        };
    }

    async getUserPolicies() {
        const jobs = await Job.findAll({});
        return jobs.items.map(job => ({
            jobId: job.jobId,
            status: job.status === 'complete' ? 'Complete' :
                job.status === 'failed' ? 'Incomplete' :
                    job.status === 'in progress' ? 'In Progress' : 'Not Started',
            policyType: job.policyType?.toUpperCase() || 'CASCO',
            createdAt: job.createdAt,
            name: job.extractedData?.clientData?.name || job.clientData?.name || 'N/A',
            phone: job.extractedData?.clientData?.phone || job.clientData?.phone || 'N/A',
            amount: job.extractedData?.offersWithFranchise?.[0]?.rate1 || '0 €',
            object: job.extractedData?.clientData?.object || 'N/A'
        }));
    }

    async deleteJob(jobId) {
        const job = await Job.findById(jobId);
        if (!job) {
            throw new ApiError(404, 'Job not found');
        }

        // Delete associated files from S3
        if (job.documents && job.documents.length > 0) {
            await Promise.all(job.documents.map(doc => {
                if (doc.key) {
                    return s3Service.deleteFile(doc.key);
                }
                return Promise.resolve();
            }));
        }

        // Delete job record from DB
        await Job.delete(jobId);

        Logger.info(`[Job ${jobId}] Deleted successfully.`);
        return { message: 'Job deleted successfully' };
    }
}

module.exports = new PolicyService();
