require('dotenv').config();
const bedrockService = require('../backend/services/bedrock.service');

async function testExtraction() {
    const text = "Polita de asigurare RCA pentru vehiculul B-123-ABC, valabila pana la 31.12.2026. Asigurat: Popescu Ion.";
    const promptTemplate = "Extract the vehicle registration number and expiry date as JSON.";

    // Test with GPT-OSS 20b
    console.log("Testing with GPT-OSS (openai.gpt-oss-20b-1:0)...");
    try {
        const resultGpt = await bedrockService.extractDataWithBedrock(text, promptTemplate);
        console.log("GPT-OSS Result:", resultGpt);
    } catch (error) {
        console.error("GPT-OSS Test Failed (Check AWS credentials/access):", error.message);
    }
}

testExtraction();
