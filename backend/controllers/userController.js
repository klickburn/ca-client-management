const User = require('../models/User');
const Task = require('../models/Task');
const bcrypt = require('bcryptjs');
const { CREATION_HIERARCHY } = require('../middleware/permissions');

// Create a new user (with hierarchy enforcement from middleware)
exports.createUser = async (req, res) => {
    const { username, password, role, assignedClients, supervisorId, clientId } = req.body;

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        if (!role) {
            return res.status(400).json({ message: 'Role is required' });
        }

        // Validate role-specific requirements
        if (role === 'article' && !supervisorId) {
            return res.status(400).json({ message: 'Article assistants require a supervisorId' });
        }
        if (role === 'client' && !clientId) {
            return res.status(400).json({ message: 'Client users require a linked clientId' });
        }

        // Validate password strength (same rules as changePassword)
        if (!password || password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters' });
        }
        if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
            return res.status(400).json({ message: 'Password must contain uppercase, lowercase, and a number' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            username,
            password: hashedPassword,
            role,
            assignedClients: role === 'article' ? (assignedClients || []) : undefined,
            supervisorId: role === 'article' ? supervisorId : undefined,
            clientId: role === 'client' ? clientId : undefined,
            createdBy: req.user.id,
        });

        await newUser.save();

        const userResponse = {
            _id: newUser._id,
            username: newUser.username,
            role: newUser.role,
            assignedClients: newUser.assignedClients,
            supervisorId: newUser.supervisorId,
            clientId: newUser.clientId,
        };

        res.status(201).json({ message: 'User created successfully', user: userResponse });
    } catch (error) {
        res.status(500).json({ message: 'Error creating user' });
    }
};

// Get all users (with task counts)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .populate('supervisorId', 'username role')
            .populate('clientId', 'name email')
            .lean();

        // Get task counts per user in one aggregation
        const taskCounts = await Task.aggregate([
            { $match: { assignedTo: { $ne: null } } },
            { $group: {
                _id: '$assignedTo',
                total: { $sum: 1 },
                open: { $sum: { $cond: [{ $nin: ['$status', ['completed']] }, 1, 0] } },
                completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                overdue: { $sum: { $cond: [{ $and: [{ $ne: ['$status', 'completed'] }, { $lt: ['$dueDate', new Date()] }] }, 1, 0] } },
            }},
        ]);

        const countMap = {};
        taskCounts.forEach(tc => { countMap[tc._id.toString()] = tc; });

        const usersWithStats = users.map(u => ({
            ...u,
            taskStats: countMap[u._id.toString()] || { total: 0, open: 0, completed: 0, overdue: 0 },
        }));

        res.status(200).json(usersWithStats);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users' });
    }
};

// Assign role to user
exports.assignRole = async (req, res) => {
    const { userId, role } = req.body;

    try {
        // Enforce hierarchy: current user must be allowed to assign this role
        const allowedToCreate = CREATION_HIERARCHY[req.user.role] || [];
        if (!allowedToCreate.includes(role)) {
            return res.status(403).json({ message: `Cannot assign role: ${role}` });
        }

        const user = await User.findByIdAndUpdate(userId, { role }, { new: true }).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'Role assigned successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Error assigning role' });
    }
};

// Delete a user by ID
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Unassign tasks that were assigned to this user
        await Task.updateMany({ assignedTo: user._id }, { $unset: { assignedTo: '' } });
        // Clear supervisorId references in article users supervised by this user
        await User.updateMany({ supervisorId: user._id }, { $unset: { supervisorId: '' } });
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user' });
    }
};

// Change own password
exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current and new password are required' });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters' });
        }
        if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
            return res.status(400).json({ message: 'Password must contain uppercase, lowercase, and a number' });
        }
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error changing password' });
    }
};

