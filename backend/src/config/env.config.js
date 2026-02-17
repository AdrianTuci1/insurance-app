
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    PORT: process.env.PORT || 3000,
    AWS: {
        REGION: process.env.AWS_REGION || 'us-east-1',
        S3_BUCKET: process.env.AWS_S3_BUCKET,
    },
    DB: {
        USERS_TABLE: 'InsuranceUsers',
        JOBS_TABLE: 'InsuranceJobs',
    },
    JWT_SECRET: process.env.JWT_SECRET || 'dev_secret',
    NETOPIA: {
        API_KEY: process.env.NETOPIA_API_KEY,
        PUBLIC_KEY_PATH: process.env.NETOPIA_PUBLIC_KEY_PATH,
        PRIVATE_KEY_PATH: process.env.NETOPIA_PRIVATE_KEY_PATH,
        IS_SANDBOX: process.env.NETOPIA_SANDBOX === 'true',
    }
};
