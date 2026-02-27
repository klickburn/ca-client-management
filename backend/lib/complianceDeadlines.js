/**
 * Indian Statutory Compliance Deadlines
 * All deadlines that a CA firm needs to track for their clients.
 * Each deadline is linked to a service type from the Client model.
 */

// Returns all deadlines for a given fiscal year (e.g., '2025-2026')
function getDeadlinesForYear(fiscalYear) {
    const [startYear, endYear] = fiscalYear.split('-').map(Number);

    const deadlines = [];

    // ── ITR Filing Deadlines ──
    deadlines.push(
        { date: `${endYear}-07-31`, title: 'ITR Filing (Non-Audit)', taskType: 'ITR Filing', service: 'Income Tax Filing', priority: 'high', description: `File Income Tax Return for AY ${endYear}-${endYear + 1} (non-audit cases)` },
        { date: `${endYear}-10-31`, title: 'ITR Filing (Audit Cases)', taskType: 'ITR Filing', service: 'Audit', priority: 'high', description: `File Income Tax Return for AY ${endYear}-${endYear + 1} (audit cases)` },
        { date: `${endYear}-11-30`, title: 'ITR Filing (Transfer Pricing)', taskType: 'ITR Filing', service: 'Income Tax Filing', priority: 'high', description: `ITR for transfer pricing cases AY ${endYear}-${endYear + 1}` },
    );

    // ── Advance Tax Deadlines ──
    deadlines.push(
        { date: `${startYear}-06-15`, title: 'Advance Tax - 1st Installment (15%)', taskType: 'Tax Planning', service: 'Income Tax Filing', priority: 'high', description: '15% of estimated tax liability' },
        { date: `${startYear}-09-15`, title: 'Advance Tax - 2nd Installment (45%)', taskType: 'Tax Planning', service: 'Income Tax Filing', priority: 'high', description: '45% cumulative of estimated tax liability' },
        { date: `${startYear}-12-15`, title: 'Advance Tax - 3rd Installment (75%)', taskType: 'Tax Planning', service: 'Income Tax Filing', priority: 'high', description: '75% cumulative of estimated tax liability' },
        { date: `${endYear}-03-15`, title: 'Advance Tax - 4th Installment (100%)', taskType: 'Tax Planning', service: 'Income Tax Filing', priority: 'urgent', description: '100% of estimated tax liability' },
    );

    // ── GST Monthly Deadlines (for each month in the FY) ──
    for (let m = 4; m <= 12; m++) {
        const year = startYear;
        const month = String(m).padStart(2, '0');
        const prevMonth = new Date(year, m - 1, 1).toLocaleString('en-IN', { month: 'long' });
        deadlines.push(
            { date: `${year}-${month}-11`, title: `GSTR-1 (${prevMonth})`, taskType: 'GST Filing', service: 'GST Filing', priority: 'high', description: `File GSTR-1 for ${prevMonth} ${year}` },
            { date: `${year}-${month}-13`, title: `GSTR-1 IFF (${prevMonth})`, taskType: 'GST Filing', service: 'GST Filing', priority: 'medium', description: `GSTR-1 IFF for QRMP taxpayers — ${prevMonth} ${year}` },
            { date: `${year}-${month}-20`, title: `GSTR-3B (${prevMonth})`, taskType: 'GST Filing', service: 'GST Filing', priority: 'high', description: `File GSTR-3B for ${prevMonth} ${year}` },
        );
    }
    for (let m = 1; m <= 3; m++) {
        const year = endYear;
        const month = String(m).padStart(2, '0');
        const prevMonth = new Date(year, m - 1, 1).toLocaleString('en-IN', { month: 'long' });
        deadlines.push(
            { date: `${year}-${month}-11`, title: `GSTR-1 (${prevMonth})`, taskType: 'GST Filing', service: 'GST Filing', priority: 'high', description: `File GSTR-1 for ${prevMonth} ${year}` },
            { date: `${year}-${month}-13`, title: `GSTR-1 IFF (${prevMonth})`, taskType: 'GST Filing', service: 'GST Filing', priority: 'medium', description: `GSTR-1 IFF for QRMP taxpayers — ${prevMonth} ${year}` },
            { date: `${year}-${month}-20`, title: `GSTR-3B (${prevMonth})`, taskType: 'GST Filing', service: 'GST Filing', priority: 'high', description: `File GSTR-3B for ${prevMonth} ${year}` },
        );
    }

    // ── GST Annual Return ──
    deadlines.push(
        { date: `${endYear}-12-31`, title: 'GSTR-9 Annual Return', taskType: 'GST Filing', service: 'GST Filing', priority: 'high', description: `File GST Annual Return for FY ${fiscalYear}` },
        { date: `${endYear}-12-31`, title: 'GSTR-9C Reconciliation', taskType: 'GST Filing', service: 'Audit', priority: 'high', description: `File GST Reconciliation Statement for FY ${fiscalYear}` },
    );

    // ── TDS Deadlines (monthly) ──
    for (let m = 4; m <= 12; m++) {
        const year = startYear;
        const month = String(m).padStart(2, '0');
        const prevMonth = new Date(year, m - 1, 1).toLocaleString('en-IN', { month: 'long' });
        deadlines.push(
            { date: `${year}-${month}-07`, title: `TDS Deposit (${prevMonth})`, taskType: 'TDS Return', service: 'Income Tax Filing', priority: 'high', description: `Deposit TDS deducted in ${prevMonth} ${year}` },
        );
    }
    for (let m = 1; m <= 3; m++) {
        const year = endYear;
        const month = String(m).padStart(2, '0');
        const prevMonth = new Date(year, m - 1, 1).toLocaleString('en-IN', { month: 'long' });
        deadlines.push(
            { date: `${year}-${month}-07`, title: `TDS Deposit (${prevMonth})`, taskType: 'TDS Return', service: 'Income Tax Filing', priority: 'high', description: `Deposit TDS deducted in ${prevMonth} ${year}` },
        );
    }

    // ── TDS Quarterly Returns ──
    deadlines.push(
        { date: `${startYear}-07-31`, title: 'TDS Return Q1 (Apr-Jun)', taskType: 'TDS Return', service: 'Income Tax Filing', priority: 'high', description: `File TDS return for Q1 FY ${fiscalYear}` },
        { date: `${startYear}-10-31`, title: 'TDS Return Q2 (Jul-Sep)', taskType: 'TDS Return', service: 'Income Tax Filing', priority: 'high', description: `File TDS return for Q2 FY ${fiscalYear}` },
        { date: `${endYear}-01-31`, title: 'TDS Return Q3 (Oct-Dec)', taskType: 'TDS Return', service: 'Income Tax Filing', priority: 'high', description: `File TDS return for Q3 FY ${fiscalYear}` },
        { date: `${endYear}-05-31`, title: 'TDS Return Q4 (Jan-Mar)', taskType: 'TDS Return', service: 'Income Tax Filing', priority: 'high', description: `File TDS return for Q4 FY ${fiscalYear}` },
    );

    // ── Tax Audit ──
    deadlines.push(
        { date: `${endYear}-09-30`, title: 'Tax Audit Report (Form 3CD)', taskType: 'Audit', service: 'Audit', priority: 'urgent', description: `Submit Tax Audit Report for FY ${fiscalYear}` },
    );

    // ── ROC Filings ──
    deadlines.push(
        { date: `${endYear}-10-30`, title: 'ROC Annual Return (Form MGT-7)', taskType: 'ROC Filing', service: 'Company Formation', priority: 'high', description: `File annual return with ROC for FY ${fiscalYear}` },
        { date: `${endYear}-10-30`, title: 'ROC Financial Statements (Form AOC-4)', taskType: 'ROC Filing', service: 'Company Formation', priority: 'high', description: `File financial statements with ROC for FY ${fiscalYear}` },
    );

    return deadlines.map(d => ({ ...d, fiscalYear }));
}

// Get current fiscal year string
function getCurrentFiscalYear() {
    const now = new Date();
    const month = now.getMonth(); // 0-indexed
    const year = now.getFullYear();
    if (month >= 3) { // April onwards
        return `${year}-${year + 1}`;
    }
    return `${year - 1}-${year}`;
}

// Document checklists per filing type
const DOCUMENT_CHECKLISTS = {
    'ITR Filing': [
        { name: 'Form 16 / 16A', category: 'Returns', required: true },
        { name: 'Bank Statements (All accounts)', category: 'Statement', required: true },
        { name: 'Investment Proofs (80C, 80D, etc.)', category: 'Financials', required: true },
        { name: 'Capital Gains Statement', category: 'Statement', required: false },
        { name: 'Rent Receipts / Agreement', category: 'Property Details', required: false },
        { name: 'Home Loan Interest Certificate', category: 'Financials', required: false },
        { name: 'Form 26AS / AIS', category: 'Returns', required: true },
        { name: 'Property Purchase/Sale Documents', category: 'Property Details', required: false },
        { name: 'Foreign Income Details', category: 'Financials', required: false },
        { name: 'Donation Receipts (80G)', category: 'Financials', required: false },
    ],
    'GST Filing': [
        { name: 'Sales Register / Invoices', category: 'Ledgers', required: true },
        { name: 'Purchase Register / Bills', category: 'Ledgers', required: true },
        { name: 'Credit/Debit Notes', category: 'Ledgers', required: false },
        { name: 'Bank Statements', category: 'Statement', required: true },
        { name: 'E-way Bills (if applicable)', category: 'Returns', required: false },
        { name: 'HSN-wise Summary', category: 'Ledgers', required: false },
    ],
    'TDS Return': [
        { name: 'TDS Challan Receipts', category: 'Returns', required: true },
        { name: 'Employee Salary Details', category: 'Ledgers', required: true },
        { name: 'Vendor Payment Details', category: 'Ledgers', required: true },
        { name: 'Form 16 / 16A Issued', category: 'Returns', required: false },
        { name: 'PAN of Deductees', category: 'Other', required: true },
    ],
    'Audit': [
        { name: 'Trial Balance', category: 'Financials', required: true },
        { name: 'Profit & Loss Account', category: 'Financials', required: true },
        { name: 'Balance Sheet', category: 'Financials', required: true },
        { name: 'Bank Statements (All accounts)', category: 'Statement', required: true },
        { name: 'Fixed Asset Register', category: 'Ledgers', required: true },
        { name: 'Stock Statement', category: 'Ledgers', required: false },
        { name: 'Sundry Debtors/Creditors List', category: 'Ledgers', required: true },
        { name: 'Cash Book', category: 'Ledgers', required: true },
        { name: 'Loan Confirmations', category: 'Financials', required: false },
        { name: 'Tax Payment Challans', category: 'Returns', required: true },
    ],
    'ROC Filing': [
        { name: 'Board Resolution', category: 'Other', required: true },
        { name: 'Audited Financial Statements', category: 'Financials', required: true },
        { name: 'Director Details / DIN', category: 'Other', required: true },
        { name: 'Shareholding Pattern', category: 'Other', required: true },
        { name: 'AGM Minutes', category: 'Other', required: true },
    ],
    'Tax Planning': [
        { name: 'Previous Year ITR', category: 'Returns', required: true },
        { name: 'Current Income Estimate', category: 'Financials', required: true },
        { name: 'Investment Details', category: 'Financials', required: false },
    ],
    'Bookkeeping': [
        { name: 'Bank Statements', category: 'Statement', required: true },
        { name: 'Sales Invoices', category: 'Ledgers', required: true },
        { name: 'Purchase Bills', category: 'Ledgers', required: true },
        { name: 'Expense Receipts', category: 'Ledgers', required: true },
        { name: 'Payroll Records', category: 'Ledgers', required: false },
    ],
};

module.exports = {
    getDeadlinesForYear,
    getCurrentFiscalYear,
    DOCUMENT_CHECKLISTS,
};
