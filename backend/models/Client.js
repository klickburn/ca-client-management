const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    phone: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    panNumber: {
        type: String,
        unique: true,
        sparse: true,
    },
    gstNumber: {
        type: String,
        unique: true,
        sparse: true,
    },
    clientType: {
        type: String,
        enum: ['Individual', 'Partnership', 'LLP', 'Pvt Ltd', 'Public Ltd', 'HUF', 'Other'],
        default: 'Individual'
    },
    services: [{
        type: String,
        enum: ['Income Tax Filing', 'GST Filing', 'Accounting', 'Audit', 'Company Formation', 'Consultancy', 'Other']
    }],
    notes: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    documents: [{
        name: {
            type: String,
            required: true
        },
        path: {
            type: String,
            required: true
        },
        type: {
            type: String
        },
        size: {
            type: Number
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }]
});

module.exports = mongoose.model('Client', clientSchema);