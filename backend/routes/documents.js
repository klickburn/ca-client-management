const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const authMiddleware = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');

// Get presigned upload URL (all authenticated users can upload)
router.post('/:clientId/documents/upload-url', authMiddleware, checkPermission('document:upload'), documentController.getUploadUrl);

// Confirm upload completed
router.post('/:clientId/documents/:documentId/confirm', authMiddleware, documentController.confirmUpload);

// List documents for a client
router.get('/:clientId/documents', authMiddleware, documentController.getDocuments);

// Get presigned download URL
router.get('/:clientId/documents/:documentId/download-url', authMiddleware, documentController.getDownloadUrl);

// Verify a document (partner, seniorCA only)
router.put('/:clientId/documents/:documentId/verify', authMiddleware, checkPermission('document:verify'), documentController.verifyDocument);

// Reject a document (partner, seniorCA only)
router.put('/:clientId/documents/:documentId/reject', authMiddleware, checkPermission('document:verify'), documentController.rejectDocument);

// Delete a document (partner only)
router.delete('/:clientId/documents/:documentId', authMiddleware, checkPermission('document:delete'), documentController.deleteDocument);

module.exports = router;
