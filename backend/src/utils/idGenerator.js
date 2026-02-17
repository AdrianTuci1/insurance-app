const crypto = require('crypto');

class IdGenerator {
    static generateId(length = 16) {
        return crypto.randomBytes(length).toString('hex');
    }

    static generateUuid() {
        return crypto.randomUUID();
    }
}

module.exports = IdGenerator;
