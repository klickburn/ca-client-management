const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/auth');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    // Only accept token from Authorization header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Verify user still exists (handles deleted users with valid tokens)
        const userExists = await User.exists({ _id: decoded.id });
        if (!userExists) {
            return res.status(401).json({ message: 'User no longer exists.' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token.' });
    }
};

module.exports = authMiddleware;
