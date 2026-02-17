const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand, ScanCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");

class DatabaseService {
    constructor() {
        this.client = new DynamoDBClient({ region: process.env.AWS_REGION });
        this.docClient = DynamoDBDocumentClient.from(this.client);
        this.USERS_TABLE = 'InsuranceUsers';
        this.JOBS_TABLE = 'InsuranceJobs';
        this.SETTINGS_TABLE = 'InsuranceSettings';
    }

    // --- USER OPERATIONS ---
    async createUser(user) {
        const userWithRole = {
            ...user,
            role: user.role || 'user',
            createdAt: user.createdAt || new Date().toISOString()
        };
        await this.docClient.send(new PutCommand({
            TableName: this.USERS_TABLE,
            Item: userWithRole
        }));
    }

    async getUserByEmail(email) {
        const result = await this.docClient.send(new GetCommand({
            TableName: this.USERS_TABLE,
            Key: { email }
        }));
        return result.Item;
    }

    async updateUser(email, data) {
        let updateExp = "set updatedAt = :updatedAt";
        let expAttrNames = {};
        let expAttrValues = { ":updatedAt": new Date().toISOString() };

        for (const [key, value] of Object.entries(data)) {
            updateExp += `, #${key} = :${key}`;
            expAttrNames[`#${key}`] = key;
            expAttrValues[`:${key}`] = value;
        }

        await this.docClient.send(new UpdateCommand({
            TableName: this.USERS_TABLE,
            Key: { email },
            UpdateExpression: updateExp,
            ExpressionAttributeNames: expAttrNames,
            ExpressionAttributeValues: expAttrValues
        }));
    }

    async deleteUser(email) {
        await this.docClient.send(new DeleteCommand({
            TableName: this.USERS_TABLE,
            Key: { email }
        }));
    }

    async listUsers() {
        const result = await this.docClient.send(new ScanCommand({
            TableName: this.USERS_TABLE
        }));
        return result.Items;
    }

    // --- SYSTEM SETTINGS ---
    async getSettings() {
        const result = await this.docClient.send(new GetCommand({
            TableName: this.SETTINGS_TABLE,
            Key: { id: 'system' }
        }));
        return result.Item || { id: 'system', dataRetention: '1 month' };
    }

    async updateSettings(settings) {
        await this.docClient.send(new PutCommand({
            TableName: this.SETTINGS_TABLE,
            Item: { id: 'system', ...settings, updatedAt: new Date().toISOString() }
        }));
    }

    // --- JOB OPERATIONS ---
    async createJob(job) {
        await this.docClient.send(new PutCommand({
            TableName: this.JOBS_TABLE,
            Item: job
        }));
    }

    async getJob(jobId) {
        const result = await this.docClient.send(new GetCommand({
            TableName: this.JOBS_TABLE,
            Key: { jobId }
        }));
        return result.Item;
    }

    async updateJobStatus(jobId, status, data = {}) {
        let updateExp = "set #status = :status, updatedAt = :updatedAt";
        let expAttrNames = { "#status": "status" };
        let expAttrValues = { ":status": status, ":updatedAt": new Date().toISOString() };

        for (const [key, value] of Object.entries(data)) {
            updateExp += `, #${key} = :${key}`;
            expAttrNames[`#${key}`] = key;
            expAttrValues[`:${key}`] = value;
        }

        await this.docClient.send(new UpdateCommand({
            TableName: this.JOBS_TABLE,
            Key: { jobId },
            UpdateExpression: updateExp,
            ExpressionAttributeNames: expAttrNames,
            ExpressionAttributeValues: expAttrValues
        }));
    }

    async getJobsByUser(userEmail) {
        const result = await this.docClient.send(new ScanCommand({
            TableName: this.JOBS_TABLE,
            FilterExpression: "userEmail = :email",
            ExpressionAttributeValues: { ":email": userEmail }
        }));
        return result.Items;
    }
}

module.exports = new DatabaseService();
