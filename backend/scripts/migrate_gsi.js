const { DynamoDBClient, ScanCommand, UpdateItemCommand } = require("@aws-sdk/client-dynamodb");
require('dotenv').config();

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const TABLE_NAME = 'InsuranceJobs'; // Using hardcoded name for safety

async function migrate() {
    console.log("Starting migration for table:", TABLE_NAME);

    let lastEvaluatedKey = undefined;
    let processedCount = 0;

    do {
        // 1. Scan all items
        const scanCommand = new ScanCommand({
            TableName: TABLE_NAME,
            ExclusiveStartKey: lastEvaluatedKey,
            FilterExpression: "attribute_not_exists(GSI1PK)" // Only get items needing migration
        });

        const response = await client.send(scanCommand);
        const items = response.Items;

        console.log(`Found ${items.length} items to migrate in this batch...`);

        if (items.length === 0 && !response.LastEvaluatedKey) {
            console.log("No items found needing migration.");
            break;
        }

        // 2. Update items
        for (const item of items) {
            const jobId = item.jobId.S;
            const createdAt = item.createdAt ? item.createdAt.S : new Date().toISOString();

            const updateCommand = new UpdateItemCommand({
                TableName: TABLE_NAME,
                Key: { jobId: { S: jobId } },
                UpdateExpression: "SET GSI1PK = :pk, GSI1SK = :sk",
                ExpressionAttributeValues: {
                    ":pk": { S: "JOB" },
                    ":sk": { S: createdAt }
                }
            });

            try {
                await client.send(updateCommand);
                process.stdout.write(".");
                processedCount++;
            } catch (err) {
                console.error(`\nFailed to update job ${jobId}:`, err);
            }
        }

        lastEvaluatedKey = response.LastEvaluatedKey;

    } while (lastEvaluatedKey);

    console.log(`\nMigration complete. Processed ${processedCount} items.`);
}

migrate();
