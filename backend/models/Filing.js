const mongoose = require('mongoose');

const filingSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  filingType: {
    type: String,
    required: true,
    enum: ['ITR', 'GSTR-1', 'GSTR-3B', 'GSTR-9', 'TDS', 'Tax Audit', 'ROC-MGT7', 'ROC-AOC4', 'Advance Tax', 'Other'],
  },
  period: { type: String, required: true }, // e.g. "Annual", "Q1", "April"
  fiscalYear: { type: String, required: true }, // e.g. "2024-2025"
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'filed', 'verified', 'rejected'],
    default: 'not_started',
  },
  dueDate: Date,
  filedDate: Date,
  acknowledgmentNumber: String,
  returnType: String, // e.g. "ITR-1", "ITR-3", "GSTR-1"
  filedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: String,
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

filingSchema.index({ client: 1, fiscalYear: 1 });
filingSchema.index({ client: 1, filingType: 1, fiscalYear: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('Filing', filingSchema);
