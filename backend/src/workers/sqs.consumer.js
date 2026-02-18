const sqsService = require('../services/sqs.service');
const policyService = require('../services/policy.service');
const Logger = require('../utils/logger');

class SqsConsumer {
    constructor() {
        this.isRunning = false;
        this.pollInterval = 5000;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        Logger.info("[SQS Consumer] Started polling...");
        this.poll();
    }

    async poll() {
        if (!this.isRunning) return;

        try {
            const messages = await sqsService.receiveMessages(1, 20); // Long polling 20s

            if (messages.length > 0) {
                for (const message of messages) {
                    await this.handleMessage(message);
                }
                setImmediate(() => this.poll());
            } else {
                setImmediate(() => this.poll());
            }
        } catch (error) {
            Logger.error("[SQS Consumer] Polling error:", error);
            setTimeout(() => this.poll(), 5000); // Backoff on error
        }
    }

    async handleMessage(message) {
        let body;
        try {
            body = JSON.parse(message.Body);
        } catch (e) {
            Logger.error("Failed to parse SQS message body:", e);
            await sqsService.deleteMessage(message.ReceiptHandle); // Dead letter if unparseable
            return;
        }

        const { jobId, files, policyType } = body;

        Logger.info(`[SQS Consumer] Processing buffer for Job ${jobId}`);

        try {
            // Process (async, not waiting unless we want strict sequential)
            // But if we don't wait, we might overload the server again. 
            // Let's await it to throttle by SQS maxMessages.
            await policyService.processFilesInBackground(jobId, files, policyType);

            // Delete after processing is done (or started successfully)
            await sqsService.deleteMessage(message.ReceiptHandle);
            Logger.info(`[SQS Consumer] Job ${jobId} finished and removed from queue.`);
        } catch (error) {
            Logger.error(`[SQS Consumer] Error processing job ${jobId}:`, error);
            // Don't delete message so it retries (implied via visibility timeout)
        }
    }
}

module.exports = new SqsConsumer();
