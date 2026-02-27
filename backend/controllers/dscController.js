const DSC = require('../models/DSC');
const ActivityLog = require('../models/ActivityLog');

const logActivity = async (action, userId, targetId, details) => {
    try {
        await ActivityLog.create({ action, performedBy: userId, targetType: 'Client', targetId, details });
    } catch (err) { console.error('Activity log error:', err.message); }
};

// Get all DSCs (with filters)
exports.getDSCs = async (req, res) => {
    try {
        const { clientId, status, expiringSoon } = req.query;
        const filter = {};

        if (clientId) filter.client = clientId;
        if (status) filter.status = status;

        if (expiringSoon === 'true') {
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            filter.expiryDate = { $lte: thirtyDaysFromNow };
            filter.status = { $ne: 'expired' };
        }

        const dscs = await DSC.find(filter)
            .populate('client', 'name panNumber')
            .populate('addedBy', 'username')
            .sort({ expiryDate: 1 });

        // Auto-update expired ones
        const now = new Date();
        for (const dsc of dscs) {
            if (dsc.status === 'active' && dsc.expiryDate < now) {
                dsc.status = 'expired';
                await dsc.save();
            }
        }

        res.json(dscs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get DSC stats
exports.getDSCStats = async (req, res) => {
    try {
        const now = new Date();
        const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        const [total, active, expired, expiringSoon] = await Promise.all([
            DSC.countDocuments(),
            DSC.countDocuments({ status: 'active', expiryDate: { $gt: now } }),
            DSC.countDocuments({ $or: [{ status: 'expired' }, { expiryDate: { $lte: now } }] }),
            DSC.countDocuments({ status: 'active', expiryDate: { $gt: now, $lte: thirtyDays } }),
        ]);

        res.json({ total, active, expired, expiringSoon });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create DSC
exports.createDSC = async (req, res) => {
    try {
        const dsc = await DSC.create({ ...req.body, addedBy: req.user.id });
        const populated = await DSC.findById(dsc._id).populate('client', 'name panNumber');
        await logActivity('client:update', req.user.id, dsc.client, `Added DSC for ${populated.client?.name}`);
        res.status(201).json(populated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update DSC
exports.updateDSC = async (req, res) => {
    try {
        const dsc = await DSC.findByIdAndUpdate(req.params.id, req.body, { new: true })
            .populate('client', 'name panNumber');
        if (!dsc) return res.status(404).json({ message: 'DSC not found' });
        res.json(dsc);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete DSC
exports.deleteDSC = async (req, res) => {
    try {
        const dsc = await DSC.findByIdAndDelete(req.params.id);
        if (!dsc) return res.status(404).json({ message: 'DSC not found' });
        await logActivity('client:update', req.user.id, dsc.client, `Removed DSC record`);
        res.json({ message: 'DSC deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
