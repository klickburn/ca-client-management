const Client = require('../models/Client');
const fs = require('fs');
const path = require('path');

// Create upload directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Upload a document for a client
exports.uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { clientId } = req.params;
        const client = await Client.findById(clientId);
        
        if (!client) {
            // Delete the uploaded file if client not found
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ message: 'Client not found' });
        }

        // Create document record
        const document = {
            name: req.file.originalname,
            path: req.file.path,
            type: req.file.mimetype,
            size: req.file.size,
            uploadedAt: Date.now(),
            uploadedBy: req.user.id
        };

        // Add document to client
        client.documents.push(document);
        await client.save();

        res.status(201).json(document);
    } catch (error) {
        console.error('Error uploading document:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all documents for a client
exports.getDocuments = async (req, res) => {
    try {
        const { clientId } = req.params;
        const client = await Client.findById(clientId).populate('documents.uploadedBy', 'username');
        
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        res.status(200).json(client.documents);
    } catch (error) {
        console.error('Error getting documents:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get a specific document
exports.getDocument = async (req, res) => {
    try {
        const { clientId, documentId } = req.params;
        const client = await Client.findById(clientId);
        
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        const document = client.documents.id(documentId);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        // Check if file exists
        const filePath = path.resolve(document.path);
        if (!fs.existsSync(filePath)) {
            console.error(`File not found at path: ${filePath}`);
            return res.status(404).json({ message: 'Document file not found on server' });
        }

        // Get file stats to determine the file size
        const stat = fs.statSync(filePath);
        
        // Set appropriate content type and headers for better download handling
        res.setHeader('Content-Type', document.type || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(document.name)}"`);
        res.setHeader('Content-Length', stat.size);
        res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');
        
        // Stream the file to avoid memory issues with large files
        const fileStream = fs.createReadStream(filePath);
        
        // Handle stream errors
        fileStream.on('error', (error) => {
            console.error('Error streaming file:', error);
            if (!res.headersSent) {
                res.status(500).json({ message: 'Error streaming file' });
            }
        });
        
        // Pipe the file to the response
        fileStream.pipe(res);
    } catch (error) {
        console.error('Error getting document:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete a document
exports.deleteDocument = async (req, res) => {
    try {
        const { clientId, documentId } = req.params;
        const client = await Client.findById(clientId);
        
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        // Find document by ID
        const document = client.documents.id(documentId);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        // Get the file path before removing the document
        const filePath = document.path;
        
        // Remove document from client using MongoDB's subdocument removal
        client.documents = client.documents.filter(doc => doc._id.toString() !== documentId);
        await client.save();

        // Delete file from filesystem
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (fileError) {
            console.error('Error deleting file:', fileError);
            // Continue even if file deletion fails
        }

        res.status(200).json({ message: 'Document deleted successfully' });
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
