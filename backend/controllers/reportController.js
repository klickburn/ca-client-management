const Client = require('../models/Client');
const Task = require('../models/Task');
const Invoice = require('../models/Invoice');
const User = require('../models/User');

// Dashboard overview stats
const getDashboardStats = async (req, res) => {
    try {
        const [totalClients, totalUsers, totalTasks, totalInvoices] = await Promise.all([
            Client.countDocuments(),
            User.countDocuments(),
            Task.countDocuments(),
            Invoice.countDocuments(),
        ]);

        // Task breakdown
        const tasksByStatus = await Task.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);

        // Overdue tasks
        const overdueTasks = await Task.countDocuments({
            status: { $nin: ['completed'] },
            dueDate: { $lt: new Date() },
        });

        // Revenue stats
        const revenueStats = await Invoice.aggregate([
            { $group: {
                _id: '$status',
                total: { $sum: '$totalAmount' },
                paid: { $sum: '$paidAmount' },
                count: { $sum: 1 },
            }},
        ]);

        // Documents count
        const docStats = await Client.aggregate([
            { $unwind: '$documents' },
            { $group: { _id: null, total: { $sum: 1 } } },
        ]);

        // Tasks due this week
        const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const tasksDueSoon = await Task.countDocuments({
            status: { $nin: ['completed'] },
            dueDate: { $gte: new Date(), $lte: weekFromNow },
        });

        // Clients by type
        const clientsByType = await Client.aggregate([
            { $group: { _id: '$clientType', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);

        // Revenue by month (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const monthlyRevenue = await Invoice.aggregate([
            { $match: { status: 'paid', paidDate: { $gte: sixMonthsAgo } } },
            { $group: {
                _id: { $dateToString: { format: '%Y-%m', date: '$paidDate' } },
                revenue: { $sum: '$paidAmount' },
            }},
            { $sort: { _id: 1 } },
        ]);

        // Tasks by type
        const tasksByType = await Task.aggregate([
            { $group: { _id: '$taskType', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);

        // Workload per user (open tasks assigned)
        const workloadPerUser = await Task.aggregate([
            { $match: { status: { $nin: ['completed'] }, assignedTo: { $ne: null } } },
            { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
            { $unwind: '$user' },
            { $project: { username: '$user.username', role: '$user.role', count: 1 } },
            { $sort: { count: -1 } },
        ]);

        res.json({
            overview: { totalClients, totalUsers, totalTasks, totalInvoices, totalDocuments: docStats[0]?.total || 0 },
            tasksByStatus: tasksByStatus.reduce((acc, t) => ({ ...acc, [t._id]: t.count }), {}),
            overdueTasks,
            tasksDueSoon,
            revenueStats: revenueStats.reduce((acc, r) => ({ ...acc, [r._id]: { total: r.total, paid: r.paid, count: r.count } }), {}),
            clientsByType,
            monthlyRevenue,
            tasksByType,
            workloadPerUser,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getDashboardStats };
