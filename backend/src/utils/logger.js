class Logger {
    static info(message, ...meta) {
        console.log(`[INFO] [${new Date().toISOString()}] ${message}`, ...meta);
    }

    static error(message, error, ...meta) {
        console.error(`[ERROR] [${new Date().toISOString()}] ${message}`, error, ...meta);
    }

    static warn(message, ...meta) {
        console.warn(`[WARN] [${new Date().toISOString()}] ${message}`, ...meta);
    }

    static debug(message, ...meta) {
        if (process.env.NODE_ENV === 'development') {
            console.debug(`[DEBUG] [${new Date().toISOString()}] ${message}`, ...meta);
        }
    }
}

module.exports = Logger;
