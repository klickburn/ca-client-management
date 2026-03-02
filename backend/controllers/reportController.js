const Client = require('../models/Client');
const Task = require('../models/Task');
const Invoice = require('../models/Invoice');
const Filing = require('../models/Filing');
const DSC = require('../models/DSC');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

// Dashboard overview stats
const getDashboardStats = async (req, res) => {
    try {
        const { fiscalYear, dateFrom, dateTo } = req.query;

        // Build date filter for tasks/invoices
        const dateFilter = {};
        if (dateFrom) dateFilter.$gte = new Date(dateFrom);
        if (dateTo) dateFilter.$lte = new Date(dateTo);
        const hasDateFilter = Object.keys(dateFilter).length > 0;

        // Task filter
        const taskFilter = {};
        if (fiscalYear) taskFilter.fiscalYear = fiscalYear;
        if (hasDateFilter) taskFilter.dueDate = dateFilter;

        // Invoice filter
        const invoiceFilter = {};
        if (fiscalYear) invoiceFilter.fiscalYear = fiscalYear;
        if (hasDateFilter) invoiceFilter.issueDate = dateFilter;

        const [totalClients, totalUsers, totalTasks, totalInvoices] = await Promise.all([
            Client.countDocuments(),
            User.countDocuments(),
            Task.countDocuments(taskFilter),
            Invoice.countDocuments(invoiceFilter),
        ]);

        // Task breakdown by status
        const tasksByStatus = await Task.aggregate([
            { $match: taskFilter },
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);

        // Overdue tasks
        const overdueFilter = { ...taskFilter, status: { $nin: ['completed'] }, dueDate: { $lt: new Date() } };
        const overdueTasks = await Task.countDocuments(overdueFilter);

        // Revenue stats
        const revenueStats = await Invoice.aggregate([
            { $match: invoiceFilter },
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
            ...taskFilter,
            status: { $nin: ['completed'] },
            dueDate: { $gte: new Date(), $lte: weekFromNow },
        });

        // Clients by type
        const clientsByType = await Client.aggregate([
            { $group: { _id: '$clientType', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);

        // Revenue by month (last 6 months or within date range)
        const revenueMonthFilter = { status: 'paid' };
        if (hasDateFilter) {
            revenueMonthFilter.paidDate = dateFilter;
        } else {
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            revenueMonthFilter.paidDate = { $gte: sixMonthsAgo };
        }
        if (fiscalYear) revenueMonthFilter.fiscalYear = fiscalYear;
        const monthlyRevenue = await Invoice.aggregate([
            { $match: revenueMonthFilter },
            { $group: {
                _id: { $dateToString: { format: '%Y-%m', date: '$paidDate' } },
                revenue: { $sum: '$paidAmount' },
            }},
            { $sort: { _id: 1 } },
        ]);

        // Tasks by type
        const tasksByType = await Task.aggregate([
            { $match: taskFilter },
            { $group: { _id: '$taskType', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);

        // Workload per user (open tasks assigned)
        const workloadPerUser = await Task.aggregate([
            { $match: { ...taskFilter, status: { $nin: ['completed'] }, assignedTo: { $ne: null } } },
            { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
            { $unwind: '$user' },
            { $project: { username: '$user.username', role: '$user.role', count: 1 } },
            { $sort: { count: -1 } },
        ]);

        // --- NEW SECTIONS ---

        // Filing status breakdown
        const filingFilter = {};
        if (fiscalYear) filingFilter.fiscalYear = fiscalYear;
        const filingsByStatus = await Filing.aggregate([
            { $match: filingFilter },
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);
        const filingsByType = await Filing.aggregate([
            { $match: filingFilter },
            { $group: {
                _id: '$filingType',
                count: { $sum: 1 },
                filed: { $sum: { $cond: [{ $in: ['$status', ['filed', 'verified']] }, 1, 0] } },
            }},
            { $sort: { count: -1 } },
        ]);

        // Compliance rate: tasks with dueDate in past that are completed vs total
        const complianceFilter = { ...taskFilter, dueDate: { $lt: new Date() } };
        const [totalDue, completedOnTime] = await Promise.all([
            Task.countDocuments(complianceFilter),
            Task.countDocuments({ ...complianceFilter, status: 'completed' }),
        ]);
        const complianceRate = totalDue > 0 ? Math.round((completedOnTime / totalDue) * 100) : 100;

        // Revenue by top clients (top 10)
        const revenueByClient = await Invoice.aggregate([
            { $match: { ...invoiceFilter, status: 'paid' } },
            { $group: { _id: '$client', totalPaid: { $sum: '$paidAmount' }, invoiceCount: { $sum: 1 } } },
            { $sort: { totalPaid: -1 } },
            { $limit: 10 },
            { $lookup: { from: 'clients', localField: '_id', foreignField: '_id', as: 'client' } },
            { $unwind: '$client' },
            { $project: { clientName: '$client.name', totalPaid: 1, invoiceCount: 1 } },
        ]);

        // Task completion trend (last 6 months)
        const trendStart = new Date();
        trendStart.setMonth(trendStart.getMonth() - 6);
        const taskCompletionTrend = await Task.aggregate([
            { $match: { completedAt: { $gte: trendStart }, status: 'completed' } },
            { $group: {
                _id: { $dateToString: { format: '%Y-%m', date: '$completedAt' } },
                count: { $sum: 1 },
            }},
            { $sort: { _id: 1 } },
        ]);

        // Overdue breakdown by type and assignee
        const overdueByType = await Task.aggregate([
            { $match: overdueFilter },
            { $group: { _id: '$taskType', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);
        const overdueByAssignee = await Task.aggregate([
            { $match: { ...overdueFilter, assignedTo: { $ne: null } } },
            { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
            { $unwind: '$user' },
            { $project: { username: '$user.username', count: 1 } },
            { $sort: { count: -1 } },
        ]);

        // Invoice aging (outstanding invoices grouped by age brackets)
        const now = new Date();
        const outstandingInvoices = await Invoice.find({
            status: { $in: ['sent', 'overdue'] },
        }).select('totalAmount paidAmount dueDate').lean();

        const invoiceAging = { current: 0, thirtyDays: 0, sixtyDays: 0, ninetyPlus: 0 };
        const invoiceAgingCount = { current: 0, thirtyDays: 0, sixtyDays: 0, ninetyPlus: 0 };
        outstandingInvoices.forEach(inv => {
            const outstanding = (inv.totalAmount || 0) - (inv.paidAmount || 0);
            const daysPast = Math.max(0, Math.floor((now - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24)));
            if (daysPast <= 0) { invoiceAging.current += outstanding; invoiceAgingCount.current++; }
            else if (daysPast <= 30) { invoiceAging.thirtyDays += outstanding; invoiceAgingCount.thirtyDays++; }
            else if (daysPast <= 60) { invoiceAging.sixtyDays += outstanding; invoiceAgingCount.sixtyDays++; }
            else { invoiceAging.ninetyPlus += outstanding; invoiceAgingCount.ninetyPlus++; }
        });

        // DSC expiry summary
        const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const [dscExpired, dscExpiringSoon, dscActive] = await Promise.all([
            DSC.countDocuments({ expiryDate: { $lt: now } }),
            DSC.countDocuments({ expiryDate: { $gte: now, $lte: thirtyDaysFromNow } }),
            DSC.countDocuments({ expiryDate: { $gt: thirtyDaysFromNow } }),
        ]);

        // Recent activity (last 15)
        const recentActivity = await ActivityLog.find()
            .populate('performedBy', 'username')
            .sort({ createdAt: -1 })
            .limit(15)
            .lean();

        // Team performance: completed tasks per user
        const teamPerformance = await Task.aggregate([
            { $match: { ...taskFilter, status: 'completed', assignedTo: { $ne: null } } },
            { $group: { _id: '$assignedTo', completed: { $sum: 1 } } },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
            { $unwind: '$user' },
            { $project: { username: '$user.username', role: '$user.role', completed: 1 } },
            { $sort: { completed: -1 } },
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
            filingsByStatus: filingsByStatus.reduce((acc, f) => ({ ...acc, [f._id]: f.count }), {}),
            filingsByType,
            complianceRate,
            totalDue,
            completedOnTime,
            revenueByClient,
            taskCompletionTrend,
            overdueByType,
            overdueByAssignee,
            invoiceAging,
            invoiceAgingCount,
            dscSummary: { expired: dscExpired, expiringSoon: dscExpiringSoon, active: dscActive },
            recentActivity,
            teamPerformance,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getDashboardStats };
