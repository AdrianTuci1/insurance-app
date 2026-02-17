const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");
const Logger = require('../utils/logger');

class BedrockService {
    constructor() {
        this.client = new BedrockRuntimeClient({ region: process.env.AWS_REGION });
        this.modelId = "openai.gpt-oss-120b-1:0";
    }

    async extractDataWithBedrock(text, promptTemplate) {
        Logger.info(`Sending text to Bedrock (${this.modelId}) for extraction. Text length: ${text.length}`);
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
            const start = Date.now();
            const response = await this.client.send(command);
            const duration = Date.now() - start;
            Logger.info(`Bedrock response received in ${duration}ms.`);

            const responseBody = JSON.parse(new TextDecoder().decode(response.body));
            let content = responseBody.choices[0].message.content;

            // Strip <reasoning> tags
            content = content.replace(/<reasoning>[\s\S]*?<\/reasoning>/g, '');

            // Strip markdown code blocks (```json ... ```)
            content = content.replace(/```json/g, '').replace(/```/g, '');

            // Find the JSON object (first '{' to last '}')
            const jsonStart = content.indexOf('{');
            const jsonEnd = content.lastIndexOf('}');

            if (jsonStart !== -1 && jsonEnd !== -1) {
                // Ensure we caught a valid range
                if (jsonEnd > jsonStart) {
                    content = content.substring(jsonStart, jsonEnd + 1);
                }
            } else {
                Logger.warn("Could not find '{}' brackets in Bedrock response. Attempting raw parse.");
            }

            try {
                return JSON.parse(content);
            } catch (parseError) {
                Logger.error("Failed to parse Bedrock JSON response. Raw Content:", responseBody.choices[0].message.content);
                Logger.error("Cleaned Content:", content);
                throw parseError;
            }
        } catch (error) {
            Logger.error("Bedrock (GPT-OSS) Error:", error);
            throw error;
        }
    }
}

module.exports = new BedrockService();
