const Logger = require('../utils/logger');

const errorMiddleware = (err, req, res, next) => {
    let { statusCode, message } = err;

    if (!statusCode) {
        statusCode = 500;
    }

    res.locals.errorMessage = err.message;

    const response = {
        code: statusCode,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    };

    if (process.env.NODE_ENV === 'development') {
        Logger.error(`API Error: ${message}`, err);
    }

    res.status(statusCode).send(response);
};

module.exports = errorMiddleware;
