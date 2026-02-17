const { TextractClient, StartDocumentAnalysisCommand, GetDocumentAnalysisCommand } = require("@aws-sdk/client-textract");

const textractClient = new TextractClient({ region: process.env.AWS_REGION });

// Async Textract: Start
exports.startTextractJob = async (s3Key) => {
    const command = new StartDocumentAnalysisCommand({
        DocumentLocation: {
            S3Object: {
                Bucket: process.env.AWS_S3_BUCKET,
                Name: s3Key
            }
        },
        // Only extracting raw text (LINES) to be more efficient and faster
        FeatureTypes: []
    });

    try {
        const response = await textractClient.send(command);
        console.log(`Started Textract Job: ${response.JobId}`);
        return response.JobId;
    } catch (error) {
        console.error("Textract Start Job Error:", error);
        throw error;
    }
};

// Async Textract: Poll for Results
exports.waitForTextractJob = async (jobId) => {
    let finished = false;
    let fullText = "";
    let nextToken = undefined;

    while (!finished) {
        const command = new GetDocumentAnalysisCommand({ JobId: jobId, NextToken: nextToken });
        try {
            const response = await textractClient.send(command);
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
                // IN_PROGRESS
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
            }
        } catch (error) {
            console.error(`Textract Polling Error for ${jobId}:`, error);
            throw error;
        }
    }
    return fullText;
};
