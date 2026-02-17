
const multer = require('multer');

// Configure storage (memory storage for direct processing)
const storage = multer.memoryStorage();

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
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

module.exports = upload;
