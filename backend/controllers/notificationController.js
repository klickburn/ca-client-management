const Notification = require('../models/Notification');

// Get notifications for current user
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get unread count
const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({ recipient: req.user.id, read: false });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Mark notification as read
const markAsRead = async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { read: true });
        res.json({ message: 'Marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Mark all as read
const markAllRead = async (req, res) => {
    try {
        await Notification.updateMany({ recipient: req.user.id, read: false }, { read: true });
        res.json({ message: 'All marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getNotifications, getUnreadCount, markAsRead, markAllRead };
