
const s3Service = require('../services/s3.service');
const textractService = require('../services/textract.service');
const bedrockService = require('../services/bedrock.service');
const templateService = require('../services/template.service');
const Job = require('../models/job.model');

const pLimit = require('p-limit');
const crypto = require('crypto');

// Limit concurrent processing
const limit = pLimit(5);

// SSE Clients Map: jobId -> [res1, res2, ...]
const sseClients = new Map();

// Helper to send SSE event
const sendEvent = (jobId, data) => {
    const clients = sseClients.get(jobId);
    if (clients) {
        clients.forEach(client => {
            client.write(`data: ${JSON.stringify(data)}\n\n`);
        });
    }
};

// 1. Start Processing (Returns Job ID)
exports.startProcessing = async (req, res) => {
    try {
        const files = req.files;
        const policyType = req.body.type || 'casco';
        const userEmail = req.user ? req.user.email : 'anonymous'; // From Auth Middleware

        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded.' });
        }

        // Create Job in DB
        const jobId = crypto.randomBytes(16).toString('hex');
        const jobData = {
            jobId,
            userEmail,
            policyType,
            status: 'not started',
            createdAt: new Date().toISOString(),
            filesCount: files.length
        };

        await Job.create(jobData);

        // Return ID immediately
        res.status(202).json({ jobId, status: 'processing', message: 'Processing started.' });

        // Start Background Work
        processFilesInBackground(jobId, files, policyType);

    } catch (error) {
        console.error("Start Processing Error:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// 2. SSE Endpoint
exports.streamJobUpdates = (req, res) => {
    const { id } = req.params;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Add client to map
    if (!sseClients.has(id)) {
        sseClients.set(id, []);
    }
    sseClients.get(id).push(res);

    // Remove client on close
    req.on('close', () => {
        const clients = sseClients.get(id);
        if (clients) {
            sseClients.set(id, clients.filter(c => c !== res));
        }
    });
};

// 3. Get Job Status (Fallback)
exports.getJobStatus = async (req, res) => {
    const { id } = req.params;
    const job = await Job.findById(id);

    if (!job) {
        return res.status(404).json({ error: 'Job not found' });
    }

    res.json(job);
};

// Background Worker Function
async function processFilesInBackground(jobId, files, policyType) {
    try {
        console.log(`[Job ${jobId}] Starting background processing for ${files.length} files.`);

        // Update Status: In Progress
        await Job.updateStatus(jobId, 'in progress');
        sendEvent(jobId, { status: 'in progress', stage: 'uploading', message: 'Uploading files to S3...' });

        // Load prompt
        let promptTemplate;
        try {
            const policyModule = require(`../policies/${policyType}/prompt`);
            promptTemplate = policyModule.PROMPT;
        } catch (err) {
            const errorMsg = `Invalid policy type: ${policyType}`;
            await Job.updateStatus(jobId, 'failed', { error: errorMsg });
            sendEvent(jobId, { status: 'failed', error: errorMsg });
            return;
        }

        // Map Phase: Upload -> Start Job -> Wait -> Extract
        let processedCount = 0;
        const extractionPromises = files.map(file => limit(async () => {
            try {
                // 1. Upload to S3
                const key = await s3Service.uploadToS3(file.buffer, file.mimetype);

                // 2. Start Textract Job (Raw Text Only)
                const textractJobId = await textractService.startTextractJob(key);

                // 3. Poll for Text
                const text = await textractService.waitForTextractJob(textractJobId);

                // 4. Bedrock Extraction (GPT-OSS-20b)
                const data = await bedrockService.extractDataWithBedrock(text, promptTemplate);

                processedCount++;
                sendEvent(jobId, { status: 'in progress', stage: 'processing', progress: `${processedCount}/${files.length}`, message: `Processed file ${file.originalname}` });

                return data;

            } catch (error) {
                console.error(`[Job ${jobId}] File processing error:`, error);
                return null;
            }
        }));

        const results = await Promise.all(extractionPromises);
        const validResults = results.filter(r => r !== null);

        if (validResults.length === 0) {
            const errorMsg = 'Failed to extract data from any document.';
            await Job.updateStatus(jobId, 'failed', { error: errorMsg });
            sendEvent(jobId, { status: 'failed', error: errorMsg });
            return;
        }

        // Reduce Phase
        sendEvent(jobId, { status: 'in progress', stage: 'aggregating', message: 'Aggregating results...' });

        const aggregatedData = {
            clientData: validResults[0].clientData || {},
            offersWithoutFranchise: [],
            offersWithFranchise: [],
            risks: validResults[0].risks || '',
            notes: validResults[0].notes || ''
        };

        validResults.forEach(result => {
            if (result.offersWithoutFranchise) aggregatedData.offersWithoutFranchise.push(...result.offersWithoutFranchise);
            if (result.offersWithFranchise) aggregatedData.offersWithFranchise.push(...result.offersWithFranchise);
            if (result.risks && result.risks.length > aggregatedData.risks.length) aggregatedData.risks = result.risks;
            if (result.notes && result.notes.length > aggregatedData.notes.length) aggregatedData.notes = result.notes;
        });

        // Render HTML
        const html = await templateService.renderTemplate(policyType, aggregatedData);

        // Update Job as Completed - Save both HTML and the raw JSON (Source of Truth)
        await Job.updateStatus(jobId, 'complete', {
            html,
            extractedData: aggregatedData
        });
        sendEvent(jobId, { status: 'complete', html, extractedData: aggregatedData });
        console.log(`[Job ${jobId}] Completed successfully.`);

    } catch (error) {
        console.error(`[Job ${jobId}] Fatal Error:`, error);
        await Job.updateStatus(jobId, 'failed', { error: error.message });
        sendEvent(jobId, { status: 'failed', error: error.message });
    }
}

// 4. Update Policy Data (JSON-First approach)
exports.updatePolicyData = async (req, res) => {
    try {
        const { id } = req.params;
        const { extractedData } = req.body;

        if (!extractedData) {
            return res.status(400).json({ error: 'Missing extractedData in request body.' });
        }

        const job = await Job.findById(id);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        // 1. Re-render HTML with new data
        const html = await templateService.renderTemplate(job.policyType, extractedData);

        // 2. Update DynamoDB with BOTH new JSON and new HTML
        await Job.updateStatus(id, 'complete', {
            extractedData,
            html,
            updatedAt: new Date().toISOString()
        });

        // 3. Return updated HTML and Data
        res.json({
            success: true,
            message: 'Policy updated successfully',
            html,
            extractedData
        });

    } catch (error) {
        console.error("Update Policy Error:", error);
        res.status(500).json({ error: 'Failed to update policy data' });
    }
};

// 5. Get All Policies Summary (Optimized for Dashboard)
exports.getUserPolicies = async (req, res) => {
    try {
        const jobs = await Job.findAll({});

        // Map to summary structure
        const summary = jobs.items.map(job => ({
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

        res.json(summary);
    } catch (error) {
        console.error("Get All Policies Error:", error);
        res.status(500).json({ error: 'Failed to fetch policies' });
    }
};
