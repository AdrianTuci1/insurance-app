
const { PutCommand, GetCommand, UpdateCommand, QueryCommand, ScanCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");
const docClient = require('../config/db.config');
const env = require('../config/env.config');
const dynamoQuery = require('../utils/dynamoQuery.util');

const TABLE_NAME = env.DB.JOBS_TABLE;

class Job {
    static async create(job) {
        // Add GSI attributes
        const jobWithGSI = {
            ...job,
            GSI1PK: "JOB",
            GSI1SK: job.createdAt || new Date().toISOString()
        };

        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: jobWithGSI
        }));
        return jobWithGSI;
    }

    static async findById(jobId) {
        const result = await docClient.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { jobId }
        }));
        return result.Item;
    }

    static async updateStatus(jobId, status, data = {}) {
        let updateExp = "set #status = :status, #updatedAt = :updatedAt";
        let expAttrNames = {
            "#status": "status",
            "#updatedAt": "updatedAt"
        };
        let expAttrValues = {
            ":status": status,
            ":updatedAt": data.updatedAt || new Date().toISOString()
        };

        // Ensure GSI attributes are set if they are missing (for old items) or if createdAt changes (unlikely but safe)
        // Note: Updating keys is weird in DynamoDB, but these are GSI keys so it's fine to update attributes.
        // However, GSI1PK is static "JOB". We should ensure it's there.
        updateExp += ", GSI1PK = :gsi1pk";
        expAttrValues[":gsi1pk"] = "JOB";

        if (data.createdAt) {
            updateExp += ", GSI1SK = :gsi1sk";
            expAttrValues[":gsi1sk"] = data.createdAt;
        }


        // Add other fields from data, but skip updatedAt as we already handled it
        const entries = Object.entries(data).filter(([key]) => key !== 'updatedAt');

        for (const [key, value] of entries) {
            const attrName = `#${key}`;
            const valName = `:${key}`;
            updateExp += `, ${attrName} = ${valName}`;
            expAttrNames[attrName] = key;
            expAttrValues[valName] = value;
        }

        console.log(`[JobModel] Updating status for ${jobId} to ${status}`);
        try {
            await docClient.send(new UpdateCommand({
                TableName: TABLE_NAME,
                Key: { jobId },
                UpdateExpression: updateExp,
                ExpressionAttributeNames: expAttrNames,
                ExpressionAttributeValues: expAttrValues
            }));
            console.log(`[JobModel] Update successful for ${jobId}`);
        } catch (error) {
            console.error(`[JobModel] Update failed for ${jobId}:`, error);
            throw error;
        }
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
        const { status, startDate, endDate, userEmail } = filters;

        // If searching/filtering by specific fields other than status/date, we might still need GSI + FilterExpression
        // But for "All Jobs" sorted by date, we use GSI1.

        let queryParams = {
            TableName: TABLE_NAME,
            IndexName: "GSI1",
            KeyConditionExpression: "GSI1PK = :pk",
            ExpressionAttributeValues: {
                ":pk": "JOB"
            },
            ScanIndexForward: false, // Descending order (newest first)
            ScanIndexForward: false, // Descending order (newest first)
            Limit: limit
        };

        if (lastEvaluatedKey) {
            queryParams.ExclusiveStartKey = lastEvaluatedKey;
        }

        const filterExpressions = [];
        const expressionAttributeNames = {};

        if (status) {
            filterExpressions.push("#status = :status");
            expressionAttributeNames["#status"] = "status";
            queryParams.ExpressionAttributeValues[":status"] = status;
        }

        if (userEmail) {
            filterExpressions.push("userEmail = :userEmail");
            queryParams.ExpressionAttributeValues[":userEmail"] = userEmail;
        }

        if (startDate && endDate) {
            // range query on GSI1SK (createdAt) if we didn't have to use GSI1PK="JOB".
            // With "JOB", SK is createdAt. So we can use KeyCondition for date range!
            // BUT: We already used GSI1PK = JOB. We can ADD range condition.
            queryParams.KeyConditionExpression += " AND GSI1SK BETWEEN :start AND :end";
            queryParams.ExpressionAttributeValues[":start"] = startDate;
            queryParams.ExpressionAttributeValues[":end"] = endDate;
        }

        if (filterExpressions.length > 0) {
            queryParams.FilterExpression = filterExpressions.join(" AND ");
            if (Object.keys(expressionAttributeNames).length > 0) {
                queryParams.ExpressionAttributeNames = expressionAttributeNames;
            }
        }

        // queryParams construction from previous block

        console.log("[Job.findAll] Query Params:", JSON.stringify(queryParams, null, 2));

        try {
            const result = await docClient.send(new QueryCommand(queryParams));
            console.log(`[Job.findAll] Success. Found ${result.Items?.length || 0} items.`);
            return {
                items: result.Items || [],
                lastEvaluatedKey: result.LastEvaluatedKey
            };
        } catch (error) {
            console.error("[Job.findAll] Error executing Query:", error);
            throw error;
        }
    }
    static async delete(jobId) {
        await docClient.send(new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { jobId }
        }));
    }
}

module.exports = Job;
