const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");

const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION });

// Bedrock Extraction - Optimized for openai.gpt-oss-20b
exports.extractDataWithBedrock = async (text, promptTemplate) => {
    const modelId = "openai.gpt-oss-20b-1:0";

    const body = JSON.stringify({
        messages: [
            { role: "system", content: promptTemplate },
            { role: "user", content: `Here is the document text:\n${text}` }
        ],
        max_completion_tokens: 4000,
        temperature: 0
    });

    const command = new InvokeModelCommand({
        modelId,
        contentType: "application/json",
        accept: "application/json",
        body: body
    });

    try {
        const response = await bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));

        // Extract content from OpenAI-compatible response format
        return JSON.parse(responseBody.choices[0].message.content);
    } catch (error) {
        console.error("Bedrock (GPT-OSS) Error:", error);
        throw error;
    }
};
