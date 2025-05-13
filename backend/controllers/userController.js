const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Create a new user
exports.createUser = async (req, res) => {
    const { username, password, role } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user with hashed password
        const newUser = new User({ 
            username, 
            password: hashedPassword, 
            role: role || 'user' 
        });
        
        await newUser.save();
        
        // Don't return the password in the response
        const userResponse = {
            _id: newUser._id,
            username: newUser.username,
            role: newUser.role
        };
        
        res.status(201).json({ message: 'User created successfully', user: userResponse });
    } catch (error) {
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
};

// Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error });
    }
};

// Assign role to user
exports.assignRole = async (req, res) => {
    const { userId, role } = req.body;

    try {
        const user = await User.findByIdAndUpdate(userId, { role }, { new: true });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'Role assigned successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Error assigning role', error });
    }
};

// Delete a user by ID
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
};

// Get user password (admin only)
exports.getUserPassword = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Since passwords are stored hashed, we can't retrieve the original
        // Instead, we'll return the hashed password (for admin viewing only)
        // In a real-world application, consider the security implications of this
        res.status(200).json({ 
            username: user.username, 
            hashedPassword: user.password 
        });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving password', error: error.message });
    }
};