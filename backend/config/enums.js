// Single source of truth for all enums used across backend and frontend

module.exports = {
  CLIENT_TYPES: ['Individual', 'Partnership', 'LLP', 'Pvt Ltd', 'Public Ltd', 'HUF', 'Other'],

  SERVICES: ['Income Tax Filing', 'GST Filing', 'Accounting', 'Audit', 'Company Formation', 'Consultancy', 'Other'],

  TASK_TYPES: ['ITR Filing', 'GST Filing', 'TDS Return', 'Audit', 'ROC Filing', 'Tax Planning', 'Bookkeeping', 'Other'],

  TASK_STATUSES: ['pending', 'in_progress', 'review', 'completed', 'overdue'],

  TASK_PRIORITIES: ['low', 'medium', 'high', 'urgent'],

  FILING_TYPES: ['ITR', 'GSTR-1', 'GSTR-3B', 'GSTR-9', 'TDS', 'Tax Audit', 'ROC-MGT7', 'ROC-AOC4', 'Advance Tax', 'Other'],

  FILING_STATUSES: ['not_started', 'in_progress', 'filed', 'verified', 'rejected'],

  INVOICE_STATUSES: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],

  DOCUMENT_CATEGORIES: ['Statement', 'Ledgers', 'Financials', 'Returns', 'Vendor Registration', 'Property Details', 'Other'],

  DOC_REQUEST_STATUSES: ['pending', 'partially_fulfilled', 'fulfilled'],

  DSC_CLASS_TYPES: ['Class 2', 'Class 3'],

  DSC_STATUSES: ['active', 'expired', 'revoked', 'renewal_pending'],

  DSC_PROVIDERS: ['eMudhra', 'Sify', 'nCode', 'Capricorn', 'NSDL'],

  DSC_PURPOSES: ['Income Tax', 'GST', 'ROC', 'MCA', 'General'],

  USER_ROLES: ['partner', 'seniorCA', 'article', 'client'],

  // Mapping from task types to filing types
  TASK_TO_FILING_MAP: {
    'ITR Filing': 'ITR',
    'GST Filing': 'GSTR-1',
    'TDS Return': 'TDS',
    'Audit': 'Tax Audit',
    'ROC Filing': 'ROC-MGT7',
  },
};
