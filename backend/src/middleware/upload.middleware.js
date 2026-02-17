
const multer = require('multer');

const multerS3 = require('multer-s3');
const { s3Client } = require('../services/s3.service');
const crypto = require('crypto');

// Configure storage (S3 streaming)
const storage = multerS3({
    s3: s3Client,
    bucket: process.env.AWS_S3_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
        const key = `policies/${Date.now()}_${crypto.randomBytes(8).toString('hex')}_${file.originalname}`;
        cb(null, key);
    }
});

// File filter (accept PDF and DOCX)
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF and DOCX are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // Increased to 50MB per file
});

module.exports = upload;
