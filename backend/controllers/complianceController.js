const Client = require('../models/Client');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { getDeadlinesForYear, getCurrentFiscalYear, DOCUMENT_CHECKLISTS } = require('../lib/complianceDeadlines');

// Get compliance calendar for a fiscal year
exports.getCalendar = async (req, res) => {
    try {
        const fiscalYear = req.query.fiscalYear || getCurrentFiscalYear();
        const deadlines = getDeadlinesForYear(fiscalYear);

        // Sort by date
        deadlines.sort((a, b) => new Date(a.date) - new Date(b.date));

        res.json({ fiscalYear, deadlines });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Auto-generate tasks from compliance deadlines for all clients
exports.generateTasks = async (req, res) => {
    try {
        const fiscalYear = req.body.fiscalYear || getCurrentFiscalYear();
        const { month } = req.body; // optional: only generate for a specific month
        const deadlines = getDeadlinesForYear(fiscalYear);

        const clients = await Client.find({});
        const createdTasks = [];
        let skipped = 0;

        for (const client of clients) {
            const clientServices = client.services || [];

            for (const deadline of deadlines) {
                // Only create tasks for deadlines matching client's services
                if (!clientServices.includes(deadline.service)) continue;

                // If month filter specified, only that month
                if (month) {
                    const deadlineMonth = new Date(deadline.date).getMonth() + 1;
                    if (deadlineMonth !== parseInt(month)) continue;
                }

                // Check if task already exists for this client + deadline
                const existing = await Task.findOne({
                    client: client._id,
                    title: deadline.title,
                    fiscalYear,
                });
                if (existing) {
                    skipped++;
                    continue;
                }

                const task = await Task.create({
                    title: deadline.title,
                    description: deadline.description,
                    client: client._id,
                    taskType: deadline.taskType,
                    priority: deadline.priority,
                    dueDate: new Date(deadline.date),
                    fiscalYear,
                    createdBy: req.user.id,
                    status: 'pending',
                });

                createdTasks.push(task);
            }
        }

        res.json({
            message: `Generated ${createdTasks.length} tasks (${skipped} already existed)`,
            created: createdTasks.length,
            skipped,
        });
    } catch (error) {
        console.error('Error generating tasks:', error);
        res.status(500).json({ message: error.message });
    }
};

// Send deadline alerts (7/3/1 day reminders)
// This can be called manually or via a cron job
exports.sendDeadlineAlerts = async (req, res) => {
    try {
        const now = new Date();
        const alertDays = [7, 3, 1];
        let notificationsSent = 0;

        for (const days of alertDays) {
            const targetDate = new Date(now);
            targetDate.setDate(targetDate.getDate() + days);
            const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
            const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

            const dueTasks = await Task.find({
                status: { $nin: ['completed'] },
                dueDate: { $gte: startOfDay, $lte: endOfDay },
            }).populate('client', 'name').populate('assignedTo', 'username');

            for (const task of dueTasks) {
                // Notify assigned user
                const recipients = [];
                if (task.assignedTo) recipients.push(task.assignedTo._id);

                // Also notify partners/seniorCAs
                const managers = await User.find({ role: { $in: ['partner', 'seniorCA'] } }).select('_id');
                managers.forEach(m => {
                    if (!recipients.some(r => r.toString() === m._id.toString())) {
                        recipients.push(m._id);
                    }
                });

                for (const recipientId of recipients) {
                    // Check if notification already sent today for this task+day combo
                    const alreadySent = await Notification.findOne({
                        recipient: recipientId,
                        'metadata.taskId': task._id.toString(),
                        'metadata.alertDays': days,
                        createdAt: { $gte: new Date(now.setHours(0, 0, 0, 0)) },
                    });
                    if (alreadySent) continue;

                    await Notification.create({
                        recipient: recipientId,
                        type: 'task:due',
                        title: `${task.title} due in ${days} day${days > 1 ? 's' : ''}`,
                        message: `${task.client?.name || 'Unknown client'} — ${task.title} is due on ${task.dueDate.toLocaleDateString('en-IN')}`,
                        link: '/tasks',
                        metadata: { taskId: task._id.toString(), alertDays: days },
                    });
                    notificationsSent++;
                }
            }
        }

        res.json({ message: `Sent ${notificationsSent} deadline alerts` });
    } catch (error) {
        console.error('Error sending alerts:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get document checklist for a task type, cross-referenced with uploaded docs
exports.getDocumentChecklist = async (req, res) => {
    try {
        const { clientId, taskType } = req.query;

        const checklist = DOCUMENT_CHECKLISTS[taskType];
        if (!checklist) {
            return res.json({ taskType, items: [], message: 'No checklist defined for this task type' });
        }

        let uploadedDocs = [];
        if (clientId) {
            const client = await Client.findById(clientId).select('documents');
            if (client) {
                uploadedDocs = client.documents || [];
            }
        }

        // Match checklist items against uploaded documents
        const items = checklist.map(item => {
            const matched = uploadedDocs.find(doc =>
                doc.name.toLowerCase().includes(item.name.toLowerCase().split(' ')[0].toLowerCase()) ||
                (doc.category === item.category && doc.name.toLowerCase().includes(item.name.split('(')[0].trim().toLowerCase().substring(0, 8)))
            );
            return {
                ...item,
                uploaded: !!matched,
                document: matched ? { _id: matched._id, name: matched.name, verificationStatus: matched.verificationStatus } : null,
            };
        });

        const total = items.length;
        const collected = items.filter(i => i.uploaded).length;

        res.json({ taskType, items, total, collected });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all available checklists
exports.getChecklists = async (req, res) => {
    res.json(Object.keys(DOCUMENT_CHECKLISTS).map(type => ({
        taskType: type,
        itemCount: DOCUMENT_CHECKLISTS[type].length,
        requiredCount: DOCUMENT_CHECKLISTS[type].filter(i => i.required).length,
    })));
};

// Validate PAN number
exports.validatePAN = async (req, res) => {
    const { pan } = req.query;
    if (!pan) return res.status(400).json({ valid: false, message: 'PAN is required' });

    const panRegex = /^[A-Z]{3}[ABCFGHLJPT][A-Z]\d{4}[A-Z]$/;
    const valid = panRegex.test(pan.toUpperCase());

    const typeMap = { A: 'Association of Persons', B: 'Body of Individuals', C: 'Company', F: 'Firm/LLP', G: 'Government', H: 'HUF', J: 'Artificial Juridical Person', L: 'Local Authority', P: 'Individual', T: 'Trust' };
    const holderType = valid ? typeMap[pan.charAt(3)] || 'Unknown' : null;

    res.json({ valid, pan: pan.toUpperCase(), holderType });
};

// Validate GSTIN
exports.validateGSTIN = async (req, res) => {
    const { gstin } = req.query;
    if (!gstin) return res.status(400).json({ valid: false, message: 'GSTIN is required' });

    const gstinRegex = /^\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z\d][A-Z\d]$/;
    const valid = gstinRegex.test(gstin.toUpperCase());

    const stateCode = valid ? gstin.substring(0, 2) : null;
    const panFromGst = valid ? gstin.substring(2, 12) : null;

    const stateCodes = { '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh', '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh', '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram', '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal', '20': 'Jharkhand', '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat', '26': 'Dadra & Nagar Haveli', '27': 'Maharashtra', '29': 'Karnataka', '30': 'Goa', '31': 'Lakshadweep', '32': 'Kerala', '33': 'Tamil Nadu', '34': 'Puducherry', '35': 'Andaman & Nicobar', '36': 'Telangana', '37': 'Andhra Pradesh' };
    const state = valid ? stateCodes[stateCode] || 'Unknown State' : null;

    res.json({ valid, gstin: gstin.toUpperCase(), stateCode, state, panFromGst });
};
