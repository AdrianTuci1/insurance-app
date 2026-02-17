
const { PutCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const docClient = require('../config/db.config');
const env = require('../config/env.config');

const TABLE_NAME = env.DB.USERS_TABLE;

class User {
    static async create(user) {
        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: user
        }));
        return user;
    }

    static async findByEmail(email) {
        const result = await docClient.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { email }
        }));
        return result.Item;
    }
}

module.exports = User;
