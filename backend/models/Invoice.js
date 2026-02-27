const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: true,
        unique: true,
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true,
    },
    items: [{
        description: {
            type: String,
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
    }],
    totalAmount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
        default: 'draft',
    },
    issueDate: {
        type: Date,
        default: Date.now,
    },
    dueDate: {
        type: Date,
        required: true,
    },
    paidDate: {
        type: Date,
    },
    paidAmount: {
        type: Number,
        default: 0,
    },
    fiscalYear: {
        type: String,
    },
    notes: {
        type: String,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { timestamps: true });

invoiceSchema.index({ client: 1 });
invoiceSchema.index({ status: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
