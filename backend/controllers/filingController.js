const Filing = require('../models/Filing');
const Client = require('../models/Client');
const { getDeadlinesForYear } = require('../lib/complianceDeadlines');

// Filing type → period mapping for auto-generation
const FILING_PERIODS = {
  'ITR':         { periods: ['Annual'], service: 'Income Tax Filing' },
  'GSTR-1':     { periods: ['April','May','June','July','August','September','October','November','December','January','February','March'], service: 'GST Filing' },
  'GSTR-3B':    { periods: ['April','May','June','July','August','September','October','November','December','January','February','March'], service: 'GST Filing' },
  'GSTR-9':     { periods: ['Annual'], service: 'GST Filing' },
  'TDS':        { periods: ['Q1','Q2','Q3','Q4'], service: 'Income Tax Filing' },
  'Tax Audit':  { periods: ['Annual'], service: 'Audit' },
  'ROC-MGT7':   { periods: ['Annual'], service: 'Company Formation' },
  'ROC-AOC4':   { periods: ['Annual'], service: 'Company Formation' },
  'Advance Tax':{ periods: ['Q1','Q2','Q3','Q4'], service: 'Income Tax Filing' },
};

// Map period to due date from compliance deadlines
function getDueDate(filingType, period, fiscalYear) {
  const [startYear, endYear] = fiscalYear.split('-').map(Number);
  const dueDates = {
    'ITR':         { 'Annual': `${endYear}-07-31` },
    'GSTR-9':      { 'Annual': `${endYear}-12-31` },
    'Tax Audit':   { 'Annual': `${endYear}-09-30` },
    'ROC-MGT7':    { 'Annual': `${endYear}-10-30` },
    'ROC-AOC4':    { 'Annual': `${endYear}-10-30` },
    'TDS':         { 'Q1': `${startYear}-07-31`, 'Q2': `${startYear}-10-31`, 'Q3': `${endYear}-01-31`, 'Q4': `${endYear}-05-31` },
    'Advance Tax': { 'Q1': `${startYear}-06-15`, 'Q2': `${startYear}-09-15`, 'Q3': `${startYear}-12-15`, 'Q4': `${endYear}-03-15` },
  };

  // GSTR-1 and GSTR-3B: monthly
  if (filingType === 'GSTR-1' || filingType === 'GSTR-3B') {
    const monthMap = { April:4, May:5, June:6, July:7, August:8, September:9, October:10, November:11, December:12, January:1, February:2, March:3 };
    const m = monthMap[period];
    if (!m) return null;
    const year = m >= 4 ? startYear : endYear;
    const day = filingType === 'GSTR-1' ? 11 : 20;
    // Due date is in the following month
    const dueMonth = m === 12 ? 1 : m + 1;
    const dueYear = m === 12 ? year + 1 : (dueMonth <= 3 && m >= 4 ? endYear : year);
    return `${dueYear}-${String(dueMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  return dueDates[filingType]?.[period] || null;
}

// Get all filings for a client
exports.getFilingsByClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { fiscalYear } = req.query;
    const query = { client: clientId };
    if (fiscalYear) query.fiscalYear = fiscalYear;

    const filings = await Filing.find(query)
      .populate('filedBy', 'username')
      .populate('createdBy', 'username')
      .sort({ filingType: 1, period: 1 });

    res.json(filings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching filings', error: error.message });
  }
};

// Create a single filing
exports.createFiling = async (req, res) => {
  try {
    const { clientId } = req.params;
    const filing = new Filing({ ...req.body, client: clientId, createdBy: req.user.id });
    await filing.save();
    res.status(201).json(filing);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Filing already exists for this type/period/year' });
    }
    res.status(500).json({ message: 'Error creating filing', error: error.message });
  }
};

// Update a filing
exports.updateFiling = async (req, res) => {
  try {
    const { filingId } = req.params;
    const updates = req.body;

    // If status is being set to 'filed' and no filedDate, set it
    if (updates.status === 'filed' && !updates.filedDate) {
      updates.filedDate = new Date();
    }
    if (updates.status === 'filed' && !updates.filedBy) {
      updates.filedBy = req.user.id;
    }

    const filing = await Filing.findByIdAndUpdate(filingId, updates, { new: true })
      .populate('filedBy', 'username')
      .populate('createdBy', 'username');

    if (!filing) return res.status(404).json({ message: 'Filing not found' });
    res.json(filing);
  } catch (error) {
    res.status(500).json({ message: 'Error updating filing', error: error.message });
  }
};

// Delete a filing
exports.deleteFiling = async (req, res) => {
  try {
    const filing = await Filing.findByIdAndDelete(req.params.filingId);
    if (!filing) return res.status(404).json({ message: 'Filing not found' });
    res.json({ message: 'Filing deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting filing', error: error.message });
  }
};

// Auto-generate filings for a client based on their services
exports.generateFilings = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { fiscalYear } = req.body;
    if (!fiscalYear) return res.status(400).json({ message: 'fiscalYear is required' });

    const client = await Client.findById(clientId);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    const clientServices = client.services || [];
    const created = [];
    const skipped = [];

    for (const [filingType, config] of Object.entries(FILING_PERIODS)) {
      if (!clientServices.includes(config.service)) continue;

      for (const period of config.periods) {
        const dueDate = getDueDate(filingType, period, fiscalYear);
        try {
          const filing = new Filing({
            client: clientId,
            filingType,
            period,
            fiscalYear,
            dueDate: dueDate ? new Date(dueDate) : undefined,
            status: 'not_started',
            createdBy: req.user.id,
          });
          await filing.save();
          created.push({ filingType, period });
        } catch (err) {
          if (err.code === 11000) {
            skipped.push({ filingType, period, reason: 'already exists' });
          } else {
            throw err;
          }
        }
      }
    }

    res.json({ message: `Generated ${created.length} filings, skipped ${skipped.length}`, created, skipped });
  } catch (error) {
    res.status(500).json({ message: 'Error generating filings', error: error.message });
  }
};

// Get filing stats for a client
exports.getFilingStats = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { fiscalYear } = req.query;
    const mongoose = require('mongoose');
    const match = { client: new mongoose.Types.ObjectId(clientId) };
    if (fiscalYear) match.fiscalYear = fiscalYear;

    const stats = await Filing.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const result = { not_started: 0, in_progress: 0, filed: 0, verified: 0, rejected: 0, total: 0, overdue: 0 };
    stats.forEach(s => { result[s._id] = s.count; result.total += s.count; });

    // Count overdue
    const overdue = await Filing.countDocuments({
      ...match,
      client: clientId,
      status: { $in: ['not_started', 'in_progress'] },
      dueDate: { $lt: new Date() },
    });
    result.overdue = overdue;

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching filing stats', error: error.message });
  }
};
