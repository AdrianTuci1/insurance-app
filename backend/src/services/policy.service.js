const pLimit = require('p-limit');
const s3Service = require('./s3.service');
const textractService = require('./textract.service');
const bedrockService = require('./bedrock.service');
const templateService = require('./template.service');
const Job = require('../models/job.model');
const ApiError = require('../utils/ApiError');
const IdGenerator = require('../utils/idGenerator');
const Logger = require('../utils/logger');

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

        // Start background processing
        this.processFilesInBackground(jobId, files, type || 'casco');

        return { jobId, status: 'processing', message: 'Processing started.' };
    }

    async processFilesInBackground(jobId, files, policyType) {
        try {
            Logger.info(`[Job ${jobId}] Starting background processing for ${files.length} files.`);

            await Job.updateStatus(jobId, 'in progress');
            this.sendSSEEvent(jobId, { status: 'in progress', stage: 'initializing', message: 'Starting processing pipeline...' });

            let promptTemplate;
            try {
                const policyModule = require(`../policies/${policyType}/prompt`);
                promptTemplate = policyModule.PROMPT;
            } catch (err) {
                const errorMsg = `Invalid policy type: ${policyType}`;
                await Job.updateStatus(jobId, 'failed', { error: errorMsg });
                this.sendSSEEvent(jobId, { status: 'failed', error: errorMsg });
                return;
            }

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
                    const tJobId = await textractService.startTextractJob(doc.key);
                    doc.textractJobId = tJobId;
                    doc.status = 'textract_started';
                } catch (err) {
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
                    const data = await bedrockService.extractDataWithBedrock(text, promptTemplate);

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

            const aggregatedData = {
                clientData: validDocs[0].data.clientData || {},
                offersWithoutFranchise: [],
                offersWithFranchise: [],
                risks: validDocs[0].data.risks || '',
                notes: validDocs[0].data.notes || ''
            };

            validDocs.forEach(doc => {
                const result = doc.data;
                if (result.offersWithoutFranchise) aggregatedData.offersWithoutFranchise.push(...result.offersWithoutFranchise);
                if (result.offersWithFranchise) aggregatedData.offersWithFranchise.push(...result.offersWithFranchise);
            });

            const html = await templateService.renderTemplate(policyType, aggregatedData);

            await Job.updateStatus(jobId, 'complete', {
                html,
                extractedData: aggregatedData,
                documents: docStates
            });

            this.sendSSEEvent(jobId, { status: 'complete', html, extractedData: aggregatedData });

        } catch (error) {
            console.error(`[Job ${jobId}] Fatal Error:`, error);
            await Job.updateStatus(jobId, 'failed', { error: error.message });
            this.sendSSEEvent(jobId, { status: 'failed', error: error.message });
        }
    }

    async getJobStatus(jobId) {
        const job = await Job.findById(jobId);
        if (!job) {
            throw new ApiError(404, 'Job not found');
        }
        return job;
    }

    async updatePolicyData(jobId, extractedData) {
        if (!extractedData) {
            throw new ApiError(400, 'Missing extractedData in request body.');
        }

        const job = await Job.findById(jobId);
        if (!job) {
            throw new ApiError(404, 'Job not found');
        }

        const html = await templateService.renderTemplate(job.policyType, extractedData);

        await Job.updateStatus(jobId, 'complete', {
            extractedData,
            html,
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
}

module.exports = new PolicyService();
