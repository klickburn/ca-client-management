const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../lib/fieldEncryption');

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

// Encrypt password before saving
dscSchema.pre('save', function (next) {
    if (this.password && !this.password.startsWith('enc:')) {
        this.password = encrypt(this.password);
    }
    next();
});

// Decrypt password in JSON output
dscSchema.methods.toJSON = function () {
    const obj = this.toObject();
    if (obj.password) obj.password = decrypt(obj.password);
    return obj;
};

module.exports = mongoose.model('DSC', dscSchema);
