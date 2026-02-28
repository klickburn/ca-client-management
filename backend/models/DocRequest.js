const mongoose = require('mongoose');

const docRequestSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  title: { type: String, required: true },
  description: String,
  documents: [{
    name: { type: String, required: true },
    category: { type: String, enum: ['Statement', 'Ledgers', 'Financials', 'Returns', 'Vendor Registration', 'Property Details', 'Other'], default: 'Other' },
    required: { type: Boolean, default: true },
    fulfilled: { type: Boolean, default: false },
    documentId: { type: mongoose.Schema.Types.ObjectId },
  }],
  fiscalYear: String,
  status: { type: String, enum: ['pending', 'partially_fulfilled', 'fulfilled'], default: 'pending' },
  dueDate: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

docRequestSchema.index({ client: 1, status: 1 });

module.exports = mongoose.model('DocRequest', docRequestSchema);
