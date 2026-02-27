const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        enum: [
            'client:create', 'client:update', 'client:delete',
            'document:upload', 'document:verify', 'document:reject', 'document:delete',
            'task:create', 'task:update', 'task:complete', 'task:delete',
            'invoice:create', 'invoice:update', 'invoice:delete', 'invoice:payment',
            'user:create', 'user:update', 'user:delete',
            'login',
        ],
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    targetType: {
        type: String,
        enum: ['Client', 'User', 'Task', 'Invoice', 'Document'],
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    details: {
        type: String,
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
    },
}, { timestamps: true });

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ performedBy: 1 });
activityLogSchema.index({ targetType: 1, targetId: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
