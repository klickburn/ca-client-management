const ActivityLog = require('../models/ActivityLog');

// Get activity logs
const getActivities = async (req, res) => {
    try {
        const { limit = 50, targetType, targetId } = req.query;
        const filter = {};

        if (targetType) filter.targetType = targetType;
        if (targetId) filter.targetId = targetId;

        const activities = await ActivityLog.find(filter)
            .populate('performedBy', 'username role')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json(activities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getActivities };
