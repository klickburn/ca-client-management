const express = require('express');
const router = express.Router();
const filingController = require('../controllers/filingController');
const authMiddleware = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');

// Get filings for a client
router.get('/:clientId', authMiddleware, filingController.getFilingsByClient);

// Get filing stats for a client
router.get('/:clientId/stats', authMiddleware, filingController.getFilingStats);

// Create a filing
router.post('/:clientId', authMiddleware, checkPermission('client:edit'), filingController.createFiling);

// Auto-generate filings for a client
router.post('/:clientId/generate', authMiddleware, checkPermission('client:edit'), filingController.generateFilings);

// Update a filing
router.put('/:filingId', authMiddleware, checkPermission('client:edit'), filingController.updateFiling);

// Delete a filing
router.delete('/:filingId', authMiddleware, checkPermission('client:delete'), filingController.deleteFiling);

module.exports = router;
