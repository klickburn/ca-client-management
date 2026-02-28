const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true,
    },
    taskType: {
        type: String,
        enum: [
            'ITR Filing', 'GST Filing', 'TDS Return', 'Audit',
            'ROC Filing', 'Tax Planning', 'Bookkeeping', 'Other'
        ],
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'review', 'completed', 'overdue'],
        default: 'pending',
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium',
    },
    dueDate: {
        type: Date,
        required: true,
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    completedAt: {
        type: Date,
    },
    fiscalYear: {
        type: String,
    },
    notes: {
        type: String,
    },
    checklist: [{
        name: String,
        collected: { type: Boolean, default: false },
        note: String,
    }],
}, { timestamps: true });

taskSchema.index({ client: 1, status: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ dueDate: 1 });
// Prevent duplicate auto-generated tasks (same client + title + fiscal year)
taskSchema.index({ client: 1, title: 1, fiscalYear: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Task', taskSchema);
