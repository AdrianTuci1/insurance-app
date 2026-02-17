const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const IdGenerator = require('../utils/idGenerator');
const Logger = require('../utils/logger');

class S3Service {
    constructor() {
        this.client = new S3Client({ region: process.env.AWS_REGION });
    }

    async uploadToS3(fileBuffer, mimetype) {
        const key = `policies/${Date.now()}_${IdGenerator.generateId(8)}`;
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key,
            Body: fileBuffer,
            ContentType: mimetype
        });

        try {
            await this.client.send(command);
            Logger.info(`Uploaded to S3: ${key}`);
            return key;
        } catch (error) {
            Logger.error("S3 Upload Error:", error);
            throw error;
        }
    }
}

const s3Service = new S3Service();
module.exports = s3Service;
module.exports.s3Client = s3Service.client;
