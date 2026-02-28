const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

// Use a dedicated encryption key or fall back to JWT_SECRET (first 32 bytes)
function getKey() {
    const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || '';
    return crypto.createHash('sha256').update(secret).digest();
}

function encrypt(text) {
    if (!text || typeof text !== 'string') return text;
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();
    // Format: iv:tag:ciphertext
    return `enc:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

function decrypt(text) {
    if (!text || typeof text !== 'string' || !text.startsWith('enc:')) return text;
    try {
        const parts = text.split(':');
        const iv = Buffer.from(parts[1], 'hex');
        const tag = Buffer.from(parts[2], 'hex');
        const encrypted = parts[3];
        const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
        decipher.setAuthTag(tag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (err) {
        // If decryption fails (e.g. old unencrypted data), return as-is
        return text;
    }
}

module.exports = { encrypt, decrypt };
