const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");
require('dotenv').config();

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const TABLE_NAME = 'InsuranceJobs';

async function verify() {
    console.log("Verifying migration for table:", TABLE_NAME);

    const scanCommand = new ScanCommand({
        TableName: TABLE_NAME
    });

    const response = await client.send(scanCommand);
    const items = response.Items || [];

    console.log(`Total items found: ${items.length}`);

    let missingCount = 0;

    for (const item of items) {
        if (!item.GSI1PK || !item.GSI1PK.S) {
            console.log(`❌ Job ${item.jobId.S} is MISSING GSI1PK`);
            missingCount++;
        } else {
            console.log(`✅ Job ${item.jobId.S} has GSI1PK: ${item.GSI1PK.S}`);
        }
    }

    if (missingCount === 0) {
        console.log("\nAll items migrated successfully! 🎉");
    } else {
        console.log(`\nFound ${missingCount} items still missing attributes.`);
    }
}

verify();
