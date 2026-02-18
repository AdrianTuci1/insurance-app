const { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } = require("@aws-sdk/client-sqs");
const Logger = require("../utils/logger");

class SQSService {
    constructor() {
        this.client = new SQSClient({ region: process.env.AWS_REGION });
        this.queueUrl = process.env.AWS_SQS_QUEUE_URL;
    }

    async sendMessage(body, delaySeconds = 0) {
        if (!this.queueUrl) {
            Logger.warn("AWS_SQS_QUEUE_URL not defined. Skipping SQS message.");
            return;
        }

        const command = new SendMessageCommand({
            QueueUrl: this.queueUrl,
            MessageBody: JSON.stringify(body),
            DelaySeconds: delaySeconds
        });

        try {
            const response = await this.client.send(command);
            Logger.info(`SQS Message sent. MessageId: ${response.MessageId}`);
            return response.MessageId;
        } catch (error) {
            Logger.error("Failed to send SQS message:", error);
            throw error;
        }
    }

    async receiveMessages(maxMessages = 1, waitTimeSeconds = 20) {
        if (!this.queueUrl) return [];

        const command = new ReceiveMessageCommand({
            QueueUrl: this.queueUrl,
            MaxNumberOfMessages: maxMessages,
            WaitTimeSeconds: waitTimeSeconds,
            VisibilityTimeout: 180, // 3 minutes to process
            AttributeNames: ["All"]
        });

        try {
            const response = await this.client.send(command);
            return response.Messages || [];
        } catch (error) {
            Logger.error("Error receiving SQS messages:", error);
            throw error;
        }
    }

    async deleteMessage(receiptHandle) {
        if (!this.queueUrl) return;

        const command = new DeleteMessageCommand({
            QueueUrl: this.queueUrl,
            ReceiptHandle: receiptHandle
        });

        try {
            await this.client.send(command);
            Logger.info("SQS Message deleted.");
        } catch (error) {
            Logger.error("Error deleting SQS message:", error);
            throw error;
        }
    }
}

module.exports = new SQSService();
