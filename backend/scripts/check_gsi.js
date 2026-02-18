const { DynamoDBClient, DescribeTableCommand } = require("@aws-sdk/client-dynamodb");
require('dotenv').config();

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const TABLE_NAME = 'InsuranceJobs';

async function checkStatus() {
    try {
        const command = new DescribeTableCommand({ TableName: TABLE_NAME });
        const response = await client.send(command);

        const table = response.Table;
        console.log(`Table Status: ${table.TableStatus}`);

        if (table.GlobalSecondaryIndexes) {
            table.GlobalSecondaryIndexes.forEach(gsi => {
                console.log(`GSI [${gsi.IndexName}] Status: ${gsi.IndexStatus}`);
                console.log(` - ProvisionedThroughput: RCU ${gsi.ProvisionedThroughput.ReadCapacityUnits} / WCU ${gsi.ProvisionedThroughput.WriteCapacityUnits}`);
            });
        } else {
            console.log("No GSIs found on table.");
        }
    } catch (error) {
        console.error("Error describing table:", error);
    }
}

checkStatus();
