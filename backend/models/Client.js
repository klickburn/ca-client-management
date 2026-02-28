const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../lib/fieldEncryption');

const addressSchema = new mongoose.Schema({
    addressType: {
        type: String,
        enum: ['Home', 'Office', 'Other'],
        default: 'Home'
    },
    streetAddress: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    postalCode: {
        type: String,
        required: true
    },
    isPrimary: {
        type: Boolean,
        default: false
    }
});

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
    addresses: {
        type: [addressSchema],
        default: []
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
    // Article assistants assigned to this client
    assignedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
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
        r2Key: {
            type: String
        },
        type: {
            type: String
        },
        size: {
            type: Number
        },
        category: {
            type: String,
            enum: ['Statement', 'Ledgers', 'Financials', 'Returns', 'Vendor Registration', 'Property Details', 'Other'],
            default: 'Other'
        },
        fiscalYear: {
            type: String
        },
        notes: {
            type: String
        },
        verificationStatus: {
            type: String,
            enum: ['pending', 'verified', 'rejected'],
            default: 'pending'
        },
        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        verifiedAt: {
            type: Date
        },
        rejectionReason: {
            type: String
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

// Encrypt sensitive password fields before saving
clientSchema.pre('save', function (next) {
    const credPaths = ['credentials.incomeTax.password', 'credentials.gst.password', 'credentials.tan.password', 'credentials.traces.password'];
    for (const path of credPaths) {
        const val = this.get(path);
        if (val && !val.startsWith('enc:')) this.set(path, encrypt(val));
    }
    for (const arr of ['bankAccounts', 'loanAccounts', 'dematAccounts']) {
        if (this[arr]) {
            for (const item of this[arr]) {
                if (item.password && !item.password.startsWith('enc:')) {
                    item.password = encrypt(item.password);
                }
            }
        }
    }
    next();
});

// Decrypt password fields when converting to JSON
clientSchema.methods.toJSON = function () {
    const obj = this.toObject();
    const credKeys = ['incomeTax', 'gst', 'tan', 'traces'];
    if (obj.credentials) {
        for (const key of credKeys) {
            if (obj.credentials[key]?.password) {
                obj.credentials[key].password = decrypt(obj.credentials[key].password);
            }
        }
    }
    for (const arr of ['bankAccounts', 'loanAccounts', 'dematAccounts']) {
        if (obj[arr]) {
            for (const item of obj[arr]) {
                if (item.password) item.password = decrypt(item.password);
            }
        }
    }
    return obj;
};

module.exports = mongoose.model('Client', clientSchema);
