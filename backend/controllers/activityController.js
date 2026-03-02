const ActivityLog = require('../models/ActivityLog');

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Get activity logs
const getActivities = async (req, res) => {
    try {
        const { limit = 50, skip = 0, targetType, targetId, performedBy, action, dateFrom, dateTo, search } = req.query;
        const filter = {};

        if (targetType) filter.targetType = targetType;
        if (targetId) filter.targetId = targetId;
        if (performedBy) filter.performedBy = performedBy;
        if (action) filter.action = { $regex: escapeRegex(action), $options: 'i' };
        if (dateFrom || dateTo) {
            filter.createdAt = {};
            if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
            if (dateTo) filter.createdAt.$lte = new Date(new Date(dateTo).setHours(23, 59, 59, 999));
        }
        if (search) {
            filter.details = { $regex: escapeRegex(search), $options: 'i' };
        }

        const [activities, total] = await Promise.all([
            ActivityLog.find(filter)
                .populate('performedBy', 'username role')
                .sort({ createdAt: -1 })
                .skip(parseInt(skip))
                .limit(parseInt(limit)),
            ActivityLog.countDocuments(filter),
        ]);

        res.json({ activities, total, hasMore: parseInt(skip) + activities.length < total });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getActivities };
