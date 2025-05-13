const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { JWT_SECRET, TOKEN_EXPIRATION } = require('../config/auth');

// Login function
exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
            expiresIn: TOKEN_EXPIRATION,
        });

        res.json({ 
            token,
            userId: user._id,
            username: user.username,
            role: user.role
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Middleware to protect routes
exports.protect = (req, res, next) => {
    const token = req.headers.authorization && req.headers.authorization.startsWith('Bearer') ? req.headers.authorization.split(' ')[1] : null;

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