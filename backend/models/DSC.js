const mongoose = require('mongoose');

const dscSchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true,
    },
    holderName: {
        type: String,
        required: true,
    },
    classType: {
        type: String,
        enum: ['Class 2', 'Class 3'],
        required: true,
    },
    provider: {
        type: String, // e.g., 'eMudhra', 'Sify', 'nCode', 'Capricorn', etc.
    },
    serialNumber: {
        type: String,
    },
    issuedDate: {
        type: Date,
    },
    expiryDate: {
        type: Date,
        required: true,
    },
    password: {
        type: String,
    },
    purpose: {
        type: String, // e.g., 'Income Tax', 'GST', 'ROC', 'General'
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'revoked', 'renewal_pending'],
        default: 'active',
    },
    notes: {
        type: String,
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { timestamps: true });

// Index for quick lookups
dscSchema.index({ client: 1 });
dscSchema.index({ expiryDate: 1 });

module.exports = mongoose.model('DSC', dscSchema);
