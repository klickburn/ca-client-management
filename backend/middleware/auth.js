const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/auth');

const authMiddleware = (req, res, next) => {
    // Check for token in Authorization header
    let token = req.header('Authorization')?.replace('Bearer ', '');
    
    // If no token in header, check query parameters
    if (!token && req.query && req.query.token) {
        token = req.query.token;
    }

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(400).json({ message: 'Invalid token.' });
    }
};

module.exports = authMiddleware;