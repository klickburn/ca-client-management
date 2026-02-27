const Invoice = require('../models/Invoice');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');

const logActivity = async (action, userId, targetId, details) => {
    try {
        await ActivityLog.create({
            action, performedBy: userId, targetType: 'Invoice', targetId, details,
        });
    } catch (err) {
        console.error('Activity log error:', err.message);
    }
};

// Generate next invoice number
const generateInvoiceNumber = async () => {
    const currentYear = new Date().getFullYear();
    const count = await Invoice.countDocuments({
        invoiceNumber: { $regex: `^INV-${currentYear}` },
    });
    return `INV-${currentYear}-${String(count + 1).padStart(4, '0')}`;
};

// Create invoice
const createInvoice = async (req, res) => {
    try {
        const invoiceNumber = await generateInvoiceNumber();
        const totalAmount = req.body.items.reduce((sum, item) => sum + item.amount, 0);

        const invoice = await Invoice.create({
            ...req.body,
            invoiceNumber,
            totalAmount,
            createdBy: req.user.id,
        });

        await logActivity('invoice:create', req.user.id, invoice._id, `Created invoice ${invoiceNumber}`);

        const populated = await Invoice.findById(invoice._id)
            .populate('client', 'name email')
            .populate('createdBy', 'username');

        res.status(201).json(populated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get invoices
const getInvoices = async (req, res) => {
    try {
        const { status, clientId } = req.query;
        const filter = {};

        if (status && status !== 'all') filter.status = status;
        if (clientId) filter.client = clientId;

        // Client role can only see their own invoices
        const { role } = req.user;
        if (role === 'client') {
            const User = require('../models/User');
            const user = await User.findById(req.user.id).select('clientId');
            if (user?.clientId) filter.client = user.clientId;
            else return res.json([]);
        }

        const invoices = await Invoice.find(filter)
            .populate('client', 'name email')
            .populate('createdBy', 'username')
            .sort({ createdAt: -1 });

        res.json(invoices);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get single invoice
const getInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate('client', 'name email phone address')
            .populate('createdBy', 'username');

        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
        res.json(invoice);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update invoice
const updateInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        if (req.body.items) {
            req.body.totalAmount = req.body.items.reduce((sum, item) => sum + item.amount, 0);
        }

        Object.assign(invoice, req.body);
        await invoice.save();

        await logActivity('invoice:update', req.user.id, invoice._id, `Updated invoice ${invoice.invoiceNumber}`);

        const populated = await Invoice.findById(invoice._id)
            .populate('client', 'name email')
            .populate('createdBy', 'username');

        res.json(populated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Record payment
const recordPayment = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        const { amount } = req.body;
        invoice.paidAmount = (invoice.paidAmount || 0) + amount;
        if (invoice.paidAmount >= invoice.totalAmount) {
            invoice.status = 'paid';
            invoice.paidDate = new Date();
        }
        await invoice.save();

        await logActivity('invoice:payment', req.user.id, invoice._id,
            `Payment of ${amount} recorded for ${invoice.invoiceNumber}`);

        const populated = await Invoice.findById(invoice._id)
            .populate('client', 'name email')
            .populate('createdBy', 'username');

        res.json(populated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete invoice
const deleteInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        await logActivity('invoice:delete', req.user.id, invoice._id, `Deleted invoice ${invoice.invoiceNumber}`);
        await Invoice.findByIdAndDelete(req.params.id);
        res.json({ message: 'Invoice deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get invoice stats
const getInvoiceStats = async (req, res) => {
    try {
        const filter = {};
        const { role } = req.user;

        if (role === 'client') {
            const User = require('../models/User');
            const user = await User.findById(req.user.id).select('clientId');
            if (user?.clientId) filter.client = user.clientId;
            else return res.json({ total: 0, paid: 0, pending: 0, overdue: 0, totalRevenue: 0, pendingRevenue: 0 });
        }

        const invoices = await Invoice.find(filter);

        const stats = {
            total: invoices.length,
            paid: invoices.filter(i => i.status === 'paid').length,
            pending: invoices.filter(i => ['draft', 'sent'].includes(i.status)).length,
            overdue: invoices.filter(i => i.status === 'overdue').length,
            totalRevenue: invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.paidAmount, 0),
            pendingRevenue: invoices.filter(i => ['draft', 'sent', 'overdue'].includes(i.status)).reduce((s, i) => s + (i.totalAmount - i.paidAmount), 0),
        };

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createInvoice, getInvoices, getInvoice, updateInvoice, recordPayment, deleteInvoice, getInvoiceStats };
