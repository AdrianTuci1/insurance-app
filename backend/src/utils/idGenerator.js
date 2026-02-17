const crypto = require('crypto');

class IdGenerator {
    static generateId(length) {
        if (length === undefined) {
            const date = new Date().toISOString().split('T')[0].split('-').join('');
            const random = crypto.randomBytes(2).toString('hex').toUpperCase();
            return `${date}-${random}`;
        }
        return crypto.randomBytes(length).toString('hex');
    }

    static generateUuid() {
        return crypto.randomUUID();
    }
}

module.exports = IdGenerator;
