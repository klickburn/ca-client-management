const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');

const logActivity = async (action, userId, targetId, details) => {
    try {
        await ActivityLog.create({
            action, performedBy: userId, targetType: 'Task', targetId, details,
        });
    } catch (err) {
        console.error('Activity log error:', err.message);
    }
};

const notify = async (recipientId, type, title, message, link) => {
    try {
        if (recipientId) {
            await Notification.create({ recipient: recipientId, type, title, message, link });
        }
    } catch (err) {
        console.error('Notification error:', err.message);
    }
};

// Create a new task
const createTask = async (req, res) => {
    try {
        const task = await Task.create({
            ...req.body,
            createdBy: req.user.id,
        });

        await logActivity('task:create', req.user.id, task._id, `Created task: ${task.title}`);

        if (task.assignedTo && task.assignedTo.toString() !== req.user.id) {
            await notify(
                task.assignedTo, 'task:assigned',
                'New Task Assigned',
                `You have been assigned: ${task.title}`,
                `/clients/${task.client}`
            );
        }

        const populated = await Task.findById(task._id)
            .populate('client', 'name')
            .populate('assignedTo', 'username')
            .populate('createdBy', 'username');

        res.status(201).json(populated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get tasks with filters
const getTasks = async (req, res) => {
    try {
        const { status, clientId, assignedTo, priority } = req.query;
        const filter = {};

        if (status && status !== 'all') filter.status = status;
        if (clientId) filter.client = clientId;
        if (priority && priority !== 'all') filter.priority = priority;

        // Scope by role
        const { role } = req.user;
        if (role === 'article') {
            filter.assignedTo = req.user.id;
        } else if (role === 'client') {
            const User = require('../models/User');
            const user = await User.findById(req.user.id).select('clientId');
            if (user?.clientId) filter.client = user.clientId;
            else return res.json([]);
        }

        if (assignedTo && (role === 'partner' || role === 'seniorCA')) {
            filter.assignedTo = assignedTo;
        }

        const tasks = await Task.find(filter)
            .populate('client', 'name')
            .populate('assignedTo', 'username')
            .populate('createdBy', 'username')
            .sort({ dueDate: 1 });

        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update task
const updateTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        const wasCompleted = task.status === 'completed';
        Object.assign(task, req.body);

        if (task.status === 'completed' && !wasCompleted) {
            task.completedAt = new Date();
            await logActivity('task:complete', req.user.id, task._id, `Completed task: ${task.title}`);
        } else {
            await logActivity('task:update', req.user.id, task._id, `Updated task: ${task.title}`);
        }

        await task.save();

        const populated = await Task.findById(task._id)
            .populate('client', 'name')
            .populate('assignedTo', 'username')
            .populate('createdBy', 'username');

        res.json(populated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete task
const deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        await logActivity('task:delete', req.user.id, task._id, `Deleted task: ${task.title}`);
        await Task.findByIdAndDelete(req.params.id);
        res.json({ message: 'Task deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get task stats for dashboard
const getTaskStats = async (req, res) => {
    try {
        const filter = {};
        const { role } = req.user;

        if (role === 'article') {
            filter.assignedTo = req.user.id;
        } else if (role === 'client') {
            const User = require('../models/User');
            const user = await User.findById(req.user.id).select('clientId');
            if (user?.clientId) filter.client = user.clientId;
            else return res.json({ pending: 0, in_progress: 0, review: 0, completed: 0, overdue: 0, dueSoon: 0 });
        }

        const [pending, in_progress, review, completed, overdue, dueSoon] = await Promise.all([
            Task.countDocuments({ ...filter, status: 'pending' }),
            Task.countDocuments({ ...filter, status: 'in_progress' }),
            Task.countDocuments({ ...filter, status: 'review' }),
            Task.countDocuments({ ...filter, status: 'completed' }),
            Task.countDocuments({ ...filter, status: { $ne: 'completed' }, dueDate: { $lt: new Date() } }),
            Task.countDocuments({
                ...filter,
                status: { $nin: ['completed', 'overdue'] },
                dueDate: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
            }),
        ]);

        res.json({ pending, in_progress, review, completed, overdue, dueSoon });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createTask, getTasks, updateTask, deleteTask, getTaskStats };
