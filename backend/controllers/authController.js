const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { JWT_SECRET, TOKEN_EXPIRATION } = require('../config/auth');

// Login function
exports.login = async (req, res) => {
    const { username, password } = req.body;
    
    // Log login attempt (sanitized)
    console.log(`Login attempt: Username: ${username}, User-Agent: ${req.headers['user-agent']}`);

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

        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
            expiresIn: TOKEN_EXPIRATION,
        });

        console.log(`Login successful: User ${username} (${user._id}) logged in`);
        
        res.json({ 
            token,
            userId: user._id,
            username: user.username,
            role: user.role
        });
    } catch (error) {
        console.error(`Login error: ${error.message}`);
        res.status(500).json({ message: 'Server error' });
    }
};

// Middleware to protect routes
exports.protect = (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log(`Auth attempt: Path: ${req.path}, Auth header present: ${!!authHeader}`);
    
    const token = authHeader && authHeader.startsWith('Bearer') 
        ? authHeader.split(' ')[1] 
        : null;

    if (!token) {
        console.log(`Auth failed: No token provided for ${req.path}`);
        return res.status(401).json({ message: 'Not authorized' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            console.log(`Auth failed: Invalid token for ${req.path} - ${err.message}`);
            return res.status(401).json({ message: 'Not authorized' });
        }
        console.log(`Auth successful: User ${decoded.id} accessed ${req.path}`);
        req.user = decoded;
        next();
    });
};