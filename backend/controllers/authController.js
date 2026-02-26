const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { JWT_SECRET, TOKEN_EXPIRATION } = require('../config/auth');

// Login function
exports.login = async (req, res) => {
    const { username, password } = req.body;

    console.log(`Login attempt: Username: ${username}`);

    try {
        const user = await User.findOne({ username });
        if (!user) {
            console.log(`Login failed: User '${username}' not found`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log(`Login failed: Invalid password for user '${username}'`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Build JWT payload with role-specific data
        const tokenPayload = {
            id: user._id,
            role: user.role,
        };

        // Include role-specific fields in token
        if (user.role === 'article') {
            tokenPayload.assignedClients = user.assignedClients;
        }
        if (user.role === 'client') {
            tokenPayload.clientId = user.clientId;
        }

        const token = jwt.sign(tokenPayload, JWT_SECRET, {
            expiresIn: TOKEN_EXPIRATION,
        });

        console.log(`Login successful: User ${username} (${user._id}) role=${user.role}`);

        res.json({
            token,
            userId: user._id,
            username: user.username,
            role: user.role,
            // Role-specific data for frontend
            ...(user.role === 'article' && { assignedClients: user.assignedClients }),
            ...(user.role === 'client' && { clientId: user.clientId }),
        });
    } catch (error) {
        console.error(`Login error: ${error.message}`);
        res.status(500).json({ message: 'Server error' });
    }
};

// Middleware to protect routes (legacy — prefer middleware/auth.js)
exports.protect = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer')
        ? authHeader.split(' ')[1]
        : null;

    if (!token) {
        return res.status(401).json({ message: 'Not authorized' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        req.user = decoded;
        next();
    });
};
