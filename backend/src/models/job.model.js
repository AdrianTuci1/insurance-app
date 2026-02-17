
const { PutCommand, GetCommand, UpdateCommand, QueryCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const docClient = require('../config/db.config');
const env = require('../config/env.config');
const dynamoQuery = require('../utils/dynamoQuery.util');

const TABLE_NAME = env.DB.JOBS_TABLE;

class Job {
    static async create(job) {
        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: job
        }));
        return job;
    }

    static async findById(jobId) {
        const result = await docClient.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { jobId }
        }));
        return result.Item;
    }

    static async updateStatus(jobId, status, data = {}) {
        let updateExp = "set #status = :status, updatedAt = :updatedAt";
        let expAttrNames = { "#status": "status" };
        let expAttrValues = { ":status": status, ":updatedAt": new Date().toISOString() };

        for (const [key, value] of Object.entries(data)) {
            updateExp += `, #${key} = :${key}`;
            expAttrNames[`#${key}`] = key;
            expAttrValues[`:${key}`] = value;
        }

        await docClient.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { jobId },
            UpdateExpression: updateExp,
            ExpressionAttributeNames: expAttrNames,
            ExpressionAttributeValues: expAttrValues
        }));
    }

    static async markAsPaid(jobId, paymentId) {
        await docClient.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { jobId },
            UpdateExpression: "set isPaid = :isPaid, paymentId = :paymentId, updatedAt = :updatedAt",
            ExpressionAttributeValues: {
                ":isPaid": true,
                ":paymentId": paymentId,
                ":updatedAt": new Date().toISOString()
            }
        }));
    }

    static async findAll(filters = {}, limit = 20, lastEvaluatedKey = null) {
        // Use Scan for now as Filters are complex and GSI might be overkill for MVP filtering on multiple fields
        // Ideally, use Query on GSI (e.g., UserEmailIndex) + FilterExpression for other fields.

        const { filterExpression, expressionAttributeNames, expressionAttributeValues } = dynamoQuery.buildFilterExpression(filters);

        const params = {
            TableName: TABLE_NAME,
            Limit: limit,
        };

        if (filterExpression) {
            params.FilterExpression = filterExpression;
            params.ExpressionAttributeNames = expressionAttributeNames;
            params.ExpressionAttributeValues = expressionAttributeValues;
        }

        if (lastEvaluatedKey) {
            params.ExclusiveStartKey = lastEvaluatedKey;
        }

        const result = await docClient.send(new ScanCommand(params));

        return {
            items: result.Items,
            lastEvaluatedKey: result.LastEvaluatedKey
        };
    }
}

module.exports = Job;
