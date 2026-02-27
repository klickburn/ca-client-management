const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');
const {
    createInvoice, getInvoices, getInvoice,
    updateInvoice, recordPayment, deleteInvoice, getInvoiceStats,
} = require('../controllers/invoiceController');

router.use(authMiddleware);

router.get('/stats', getInvoiceStats);
router.get('/', getInvoices);
router.get('/:id', getInvoice);
router.post('/', checkPermission('billing:create'), createInvoice);
router.put('/:id', checkPermission('billing:edit'), updateInvoice);
router.post('/:id/payment', checkPermission('billing:edit'), recordPayment);
router.delete('/:id', checkPermission('billing:delete'), deleteInvoice);

module.exports = router;
