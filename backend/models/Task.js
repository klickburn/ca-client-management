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
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
