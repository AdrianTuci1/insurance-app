const { TextractClient, StartDocumentAnalysisCommand, GetDocumentAnalysisCommand } = require("@aws-sdk/client-textract");
const Logger = require('../utils/logger');

class TextractService {
    constructor() {
        this.client = new TextractClient({ region: process.env.AWS_REGION });
    }

    async startTextractJob(s3Key) {
        const command = new StartDocumentAnalysisCommand({
            DocumentLocation: {
                S3Object: {
                    Bucket: process.env.AWS_S3_BUCKET,
                    Name: s3Key
                }
            },
            FeatureTypes: []
        });

        try {
            const response = await this.client.send(command);
            Logger.info(`Started Textract Job: ${response.JobId}`);
            return response.JobId;
        } catch (error) {
            Logger.error("Textract Start Job Error:", error);
            throw error;
        }
    }

    async waitForTextractJob(jobId) {
        let finished = false;
        let fullText = "";
        let nextToken = undefined;

        while (!finished) {
            const command = new GetDocumentAnalysisCommand({ JobId: jobId, NextToken: nextToken });
            try {
                const response = await this.client.send(command);
                const status = response.JobStatus;

                if (status === "SUCCEEDED") {
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
                    throw new Error(`Textract Job ${jobId} Failed`);
                } else {
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
