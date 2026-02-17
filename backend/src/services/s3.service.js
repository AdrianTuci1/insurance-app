const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const crypto = require('crypto');

const s3Client = new S3Client({ region: process.env.AWS_REGION });

exports.uploadToS3 = async (fileBuffer, mimetype) => {
    const key = `policies/${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        Body: fileBuffer,
        ContentType: mimetype
    });
    try {
        await s3Client.send(command);
        console.log(`Uploaded to S3: ${key}`);
        return key;
    } catch (error) {
        console.error("S3 Upload Error:", error);
        throw error;
    }
};
