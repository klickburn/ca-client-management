const Client = require('../models/Client');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const logActivity = async (action, userId, targetId, details) => {
    try {
        await ActivityLog.create({ action, performedBy: userId, targetType: 'Document', targetId, details });
    } catch (err) { console.error('Activity log error:', err.message); }
};
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { r2Client, R2_BUCKET } = require('../config/r2');

// Get a presigned upload URL
exports.getUploadUrl = async (req, res) => {
    try {
        const { clientId } = req.params;
        const { filename, contentType, category, fiscalYear, notes } = req.body;

        if (!filename || !contentType) {
            return res.status(400).json({ message: 'filename and contentType are required' });
        }

        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        // Build R2 key: /{clientId}/{fiscalYear}/{category}/{timestamp}-{filename}
        const year = fiscalYear || 'unclassified';
        const cat = category || 'Other';
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${filename}`;
        const r2Key = `${clientId}/${year}/${cat}/${uniqueName}`;

        const command = new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: r2Key,
            ContentType: contentType,
        });

        const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 600 }); // 10 min

        // Save document metadata (upload not yet confirmed)
        const document = {
            name: filename,
            path: r2Key,
            r2Key: r2Key,
            type: contentType,
            size: 0,
            category: cat,
            fiscalYear: fiscalYear || '',
            notes: notes || '',
            verificationStatus: 'pending',
            uploadedAt: Date.now(),
            uploadedBy: req.user.id,
        };

        client.documents.push(document);
        await client.save();

        const savedDoc = client.documents[client.documents.length - 1];

        res.status(200).json({
            uploadUrl,
            documentId: savedDoc._id,
            r2Key,
        });
    } catch (error) {
        console.error('Error generating upload URL:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Confirm upload completed (update file size)
exports.confirmUpload = async (req, res) => {
    try {
        const { clientId, documentId } = req.params;
        const { size } = req.body;

        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        const document = client.documents.id(documentId);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        if (size) {
            document.size = size;
        }

        await client.save();

        await logActivity('document:upload', req.user.id, clientId, `Uploaded document: ${document.name}`);
        res.status(200).json({ message: 'Upload confirmed', document });
    } catch (error) {
        console.error('Error confirming upload:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all documents for a client
exports.getDocuments = async (req, res) => {
    try {
        const { clientId } = req.params;
        const { category, fiscalYear } = req.query;

        const client = await Client.findById(clientId).populate('documents.uploadedBy', 'username');

        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        let documents = client.documents;

        if (category) {
            documents = documents.filter(doc => doc.category === category);
        }

        if (fiscalYear) {
            documents = documents.filter(doc => doc.fiscalYear === fiscalYear);
        }

        res.status(200).json(documents);
    } catch (error) {
        console.error('Error getting documents:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get a presigned download URL
exports.getDownloadUrl = async (req, res) => {
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

        const key = document.r2Key || document.path;

        const command = new GetObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
            ResponseContentDisposition: `attachment; filename="${encodeURIComponent(document.name)}"`,
        });

        const downloadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 }); // 1 hour

        res.status(200).json({ downloadUrl, document });
    } catch (error) {
        console.error('Error generating download URL:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Verify a document
exports.verifyDocument = async (req, res) => {
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

        document.verificationStatus = 'verified';
        document.verifiedBy = req.user.id;
        document.verifiedAt = new Date();
        document.rejectionReason = undefined;

        await client.save();

        await logActivity('document:verify', req.user.id, clientId, `Verified document: ${document.name}`);
        res.status(200).json({ message: 'Document verified', document });
    } catch (error) {
        console.error('Error verifying document:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Reject a document
exports.rejectDocument = async (req, res) => {
    try {
        const { clientId, documentId } = req.params;
        const { reason } = req.body;
        const client = await Client.findById(clientId);

        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        const document = client.documents.id(documentId);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        document.verificationStatus = 'rejected';
        document.verifiedBy = req.user.id;
        document.verifiedAt = new Date();
        document.rejectionReason = reason || '';

        await client.save();

        await logActivity('document:reject', req.user.id, clientId, `Rejected document: ${document.name}`);
        res.status(200).json({ message: 'Document rejected', document });
    } catch (error) {
        console.error('Error rejecting document:', error);
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

        const document = client.documents.id(documentId);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        // Delete from R2
        const key = document.r2Key || document.path;
        try {
            const command = new DeleteObjectCommand({
                Bucket: R2_BUCKET,
                Key: key,
            });
            await r2Client.send(command);
        } catch (r2Error) {
            console.error('Error deleting from R2:', r2Error);
        }

        // Remove document from client
        client.documents = client.documents.filter(doc => doc._id.toString() !== documentId);
        await client.save();

        await logActivity('document:delete', req.user.id, clientId, `Deleted document: ${document.name}`);
        res.status(200).json({ message: 'Document deleted successfully' });
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
