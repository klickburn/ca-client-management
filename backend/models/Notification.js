const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: [
            'task:assigned', 'task:due_soon', 'task:overdue', 'task:completed',
            'document:uploaded', 'document:verified', 'document:rejected',
            'invoice:created', 'invoice:due_soon', 'invoice:overdue', 'invoice:paid',
            'general',
        ],
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    read: {
        type: Boolean,
        default: false,
    },
    link: {
        type: String,
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
    },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
