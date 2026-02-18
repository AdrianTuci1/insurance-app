const { DynamoDBClient, UpdateTableCommand } = require("@aws-sdk/client-dynamodb");
require('dotenv').config();

const client = new DynamoDBClient({ region: process.env.AWS_REGION });

const TABLE_NAME = 'InsuranceJobs'; // Using the hardcoded name from config for safety, or process.env if preferred

async function addGSI() {
    const command = new UpdateTableCommand({
        TableName: TABLE_NAME,
        AttributeDefinitions: [
            { AttributeName: "GSI1PK", AttributeType: "S" },
            { AttributeName: "GSI1SK", AttributeType: "S" }
        ],
        GlobalSecondaryIndexUpdates: [
            {
                Create: {
                    IndexName: "GSI1",
                    KeySchema: [
                        { AttributeName: "GSI1PK", KeyType: "HASH" }, // Partition Key
                        { AttributeName: "GSI1SK", KeyType: "RANGE" } // Sort Key
                    ],
                    Projection: {
                        ProjectionType: "ALL"
                    },
                    ProvisionedThroughput: {
                        ReadCapacityUnits: 5,
                        WriteCapacityUnits: 5
                    }
                }
            }
        ]
    });

    try {
        console.log("Adding GSI1 to", TABLE_NAME, "...");
        const response = await client.send(command);
        console.log("Success! Index is being created. This may take a few minutes.");
        console.log("Status:", response.TableDescription.TableStatus);
    } catch (error) {
        if (error.name === 'ResourceInUseException') {
            console.error("Use a different index name or wait until current operations finish.");
        }
        console.error("Error adding GSI:", error);
    }
}

addGSI();
