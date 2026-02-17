
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand, ScanCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE = 'InsuranceUsers';
const JOBS_TABLE = 'InsuranceJobs';
const SETTINGS_TABLE = 'InsuranceSettings';

// --- USER OPERATIONS ---
exports.createUser = async (user) => {
    // Ensure role is set, default to 'user' if not provided
    const userWithRole = {
        ...user,
        role: user.role || 'user',
        createdAt: user.createdAt || new Date().toISOString()
    };
    await docClient.send(new PutCommand({
        TableName: USERS_TABLE,
        Item: userWithRole
    }));
};

exports.getUserByEmail = async (email) => {
    const result = await docClient.send(new GetCommand({
        TableName: USERS_TABLE,
        Key: { email }
    }));
    return result.Item;
};

exports.updateUser = async (email, data) => {
    let updateExp = "set updatedAt = :updatedAt";
    let expAttrNames = {};
    let expAttrValues = { ":updatedAt": new Date().toISOString() };

    for (const [key, value] of Object.entries(data)) {
        updateExp += `, #${key} = :${key}`;
        expAttrNames[`#${key}`] = key;
        expAttrValues[`:${key}`] = value;
    }

    await docClient.send(new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { email },
        UpdateExpression: updateExp,
        ExpressionAttributeNames: expAttrNames,
        ExpressionAttributeValues: expAttrValues
    }));
};

exports.deleteUser = async (email) => {
    await docClient.send(new DeleteCommand({
        TableName: USERS_TABLE,
        Key: { email }
    }));
};

exports.listUsers = async () => {
    const result = await docClient.send(new ScanCommand({
        TableName: USERS_TABLE
    }));
    return result.Items;
};

// --- SYSTEM SETTINGS ---
exports.getSettings = async () => {
    // For simplicity, we use a single record with PK 'system'
    const result = await docClient.send(new GetCommand({
        TableName: SETTINGS_TABLE,
        Key: { id: 'system' }
    }));
    return result.Item || { id: 'system', dataRetention: '1 month' }; // Default
};

exports.updateSettings = async (settings) => {
    await docClient.send(new PutCommand({
        TableName: SETTINGS_TABLE,
        Item: { id: 'system', ...settings, updatedAt: new Date().toISOString() }
    }));
};

// --- JOB OPERATIONS ---
exports.createJob = async (job) => {
    await docClient.send(new PutCommand({
        TableName: JOBS_TABLE,
        Item: job
    }));
};

exports.getJob = async (jobId) => {
    const result = await docClient.send(new GetCommand({
        TableName: JOBS_TABLE,
        Key: { jobId }
    }));
    return result.Item;
};

exports.updateJobStatus = async (jobId, status, data = {}) => {
    // Dynamic Update Expression
    let updateExp = "set #status = :status, updatedAt = :updatedAt";
    let expAttrNames = { "#status": "status" };
    let expAttrValues = { ":status": status, ":updatedAt": new Date().toISOString() };

    for (const [key, value] of Object.entries(data)) {
        updateExp += `, #${key} = :${key}`;
        expAttrNames[`#${key}`] = key;
        expAttrValues[`:${key}`] = value;
    }

    await docClient.send(new UpdateCommand({
        TableName: JOBS_TABLE,
        Key: { jobId },
        UpdateExpression: updateExp,
        ExpressionAttributeNames: expAttrNames,
        ExpressionAttributeValues: expAttrValues
    }));
};

exports.getJobsByUser = async (userEmail) => {
    // Scan is inefficient for large datasets, but ok for MVP. 
    // Ideally use GSI on userEmail.
    const result = await docClient.send(new ScanCommand({
        TableName: JOBS_TABLE,
        FilterExpression: "userEmail = :email",
        ExpressionAttributeValues: { ":email": userEmail }
    }));
    return result.Items;
};
