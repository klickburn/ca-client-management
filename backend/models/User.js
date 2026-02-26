const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['partner', 'seniorCA', 'article', 'client'],
        required: true
    },
    // For article users: which clients they are assigned to
    assignedClients: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    }],
    // For article users: their supervising Sr. CA or Partner
    supervisorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // For client-role users: link to their Client document
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    // Who created this user (for hierarchy tracking)
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
