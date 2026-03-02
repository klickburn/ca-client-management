const crypto = require('crypto');

// JWT secret — must be set in .env for production
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your_jwt_secret_for_production') {
    if (process.env.NODE_ENV === 'production') {
        console.error('FATAL: JWT_SECRET must be set in production. Exiting.');
        process.exit(1);
    }
    console.error('⚠️  WARNING: Set a strong JWT_SECRET in .env (at least 64 random characters)');
}

const JWT_SECRET = process.env.JWT_SECRET && process.env.JWT_SECRET !== 'your_jwt_secret_for_production'
    ? process.env.JWT_SECRET
    : crypto.randomBytes(64).toString('hex');

const TOKEN_EXPIRATION = process.env.TOKEN_EXPIRATION || '4h';

module.exports = {
    JWT_SECRET,
    TOKEN_EXPIRATION
};
