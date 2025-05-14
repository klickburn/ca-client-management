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
    dateOfBirth: {
        type: Date,
    },
    aadharNumber: {
        type: String,
        unique: true,
        sparse: true,
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
    tanNumber: {
        type: String,
        unique: true,
        sparse: true,
    },
    credentials: {
        incomeTax: {
            username: String,
            password: String
        },
        gst: {
            username: String,
            password: String
        },
        tan: {
            username: String,
            password: String
        },
        traces: {
            username: String,
            password: String
        }
    },
    bankAccounts: [{
        bankName: String,
        accountNumber: String,
        customerId: String,
        password: String,
        accountType: String,
        ifscCode: String,
        branch: String
    }],
    loanAccounts: [{
        loanType: String,
        lenderName: String,
        accountNumber: String,
        amount: Number,
        interestRate: String,
        startDate: Date,
        endDate: Date,
        emiAmount: Number,
        username: String,
        password: String
    }],
    dematAccounts: [{
        brokerName: String,
        accountNumber: String,
        username: String,
        password: String
    }],
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