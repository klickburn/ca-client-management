const express = require('express');
const router = express.Router();
const docRequestController = require('../controllers/docRequestController');
const authMiddleware = require('../middleware/auth');
const { checkPermission, filterClientAccess } = require('../middleware/permissions');

// Get requests for a client
router.get('/:clientId', authMiddleware, filterClientAccess, docRequestController.getRequestsByClient);

// Create a request (partner/seniorCA)
router.post('/:clientId', authMiddleware, checkPermission('client:edit'), docRequestController.createRequest);

// Update a request
router.put('/:requestId', authMiddleware, checkPermission('client:edit'), docRequestController.updateRequest);

// Fulfill a document item (any authenticated — controller handles client access)
router.put('/:requestId/fulfill/:itemIndex', authMiddleware, docRequestController.fulfillItem);

// Delete a request
router.delete('/:requestId', authMiddleware, checkPermission('client:delete'), docRequestController.deleteRequest);

module.exports = router;
