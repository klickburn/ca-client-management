const jwt = require('jsonwebtoken');

// Use environment variables for JWT secret and expiration, or use defaults
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Use a strong secret in production
const TOKEN_EXPIRATION = process.env.TOKEN_EXPIRATION || '1d'; // Increased to 1 day for better UX

module.exports = {
    JWT_SECRET,
    TOKEN_EXPIRATION
};