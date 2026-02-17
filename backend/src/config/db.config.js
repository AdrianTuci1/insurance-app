
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const env = require('./env.config');

const client = new DynamoDBClient({ region: env.AWS.REGION });
const docClient = DynamoDBDocumentClient.from(client);

module.exports = docClient;
