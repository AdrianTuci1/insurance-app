const { TextractClient, StartDocumentTextDetectionCommand, GetDocumentTextDetectionCommand } = require("@aws-sdk/client-textract");
const Logger = require('../utils/logger');

class TextractService {
    constructor() {
        this.client = new TextractClient({ region: process.env.AWS_REGION });
    }

    async startTextractJob(s3Key) {
        Logger.info(`Starting Textract job for key: ${s3Key}`);
        const command = new StartDocumentTextDetectionCommand({
            DocumentLocation: {
                S3Object: {
                    Bucket: process.env.AWS_S3_BUCKET,
                    Name: s3Key
                }
            },
        });

        try {
            const response = await this.client.send(command);
            Logger.info(`Textract job started successfully. JobId: ${response.JobId}`);
            return response.JobId;
        } catch (error) {
            Logger.error(`Failed to start Textract job for ${s3Key}:`, error);
            throw error;
        }
    }

    async waitForTextractJob(jobId) {
        Logger.info(`Polling Textract job: ${jobId}`);
        let finished = false;
        let fullText = "";
        let nextToken = undefined;

        while (!finished) {
            const command = new GetDocumentTextDetectionCommand({ JobId: jobId, NextToken: nextToken });
            try {
                const response = await this.client.send(command);
                const status = response.JobStatus;

                if (status === "SUCCEEDED") {
                    Logger.info(`Textract job ${jobId} succeeded (token: ${nextToken ? 'yes' : 'no'}).`);
                    const text = response.Blocks
                        .filter(block => block.BlockType === 'LINE')
                        .map(line => line.Text)
                        .join('\n');

                    fullText += text + '\n';

                    if (response.NextToken) {
                        nextToken = response.NextToken;
                    } else {
                        finished = true;
                    }
                } else if (status === "FAILED") {
                    Logger.error(`Textract job ${jobId} failed with status: ${status}, Message: ${response.StatusMessage}`);
                    throw new Error(`Textract Job ${jobId} Failed`);
                } else {
                    // Logger.debug(`Job ${jobId} status: ${status}`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            } catch (error) {
                Logger.error(`Textract Polling Error for ${jobId}:`, error);
                throw error;
            }
        }
        return fullText;
    }
}

module.exports = new TextractService();
