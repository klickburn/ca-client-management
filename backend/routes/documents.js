const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const documentController = require('../controllers/documentController');
const authMiddleware = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: function(req, file, cb) {
        // Create unique filename with original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
    },
    fileFilter: function(req, file, cb) {
        // Accept common document types
        const allowedFileTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'image/jpeg',
            'image/png'
        ];
        
        if (allowedFileTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, Word, Excel, and image files are allowed.'));
        }
    }
});

// Routes for document operations
router.post('/:clientId/documents', authMiddleware, upload.single('document'), documentController.uploadDocument);
router.get('/:clientId/documents', authMiddleware, documentController.getDocuments);
router.get('/:clientId/documents/:documentId', authMiddleware, documentController.getDocument);
router.delete('/:clientId/documents/:documentId', authMiddleware, documentController.deleteDocument);

module.exports = router;
