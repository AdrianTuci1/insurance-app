const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");
const Logger = require('../utils/logger');

class BedrockService {
    constructor() {
        this.client = new BedrockRuntimeClient({ region: process.env.AWS_REGION });
        this.modelId = "openai.gpt-oss-20b-1:0";
    }

    async extractDataWithBedrock(text, promptTemplate) {
        const body = JSON.stringify({
            messages: [
                { role: "system", content: promptTemplate },
                { role: "user", content: `Here is the document text:\n${text}` }
            ],
            max_completion_tokens: 4000,
            temperature: 0
        });

        const command = new InvokeModelCommand({
            modelId: this.modelId,
            contentType: "application/json",
            accept: "application/json",
            body: body
        });

        try {
            const response = await this.client.send(command);
            const responseBody = JSON.parse(new TextDecoder().decode(response.body));

            return JSON.parse(responseBody.choices[0].message.content);
        } catch (error) {
            Logger.error("Bedrock (GPT-OSS) Error:", error);
            throw error;
        }
    }
}

module.exports = new BedrockService();
