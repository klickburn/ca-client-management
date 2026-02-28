const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// JWT secret — must be set in .env. Falls back to random bytes (tokens won't persist across restarts)
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your_jwt_secret_for_production') {
    console.error('⚠️  WARNING: Set a strong JWT_SECRET in .env (at least 64 random characters)');
}
const JWT_SECRET = process.env.JWT_SECRET && process.env.JWT_SECRET !== 'your_jwt_secret_for_production'
    ? process.env.JWT_SECRET
    : crypto.randomBytes(64).toString('hex');
const TOKEN_EXPIRATION = process.env.TOKEN_EXPIRATION || '1d';

module.exports = {
    JWT_SECRET,
    TOKEN_EXPIRATION
};