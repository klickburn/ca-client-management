import React, { useState, useEffect } from 'react';
import documentService from '../../services/documentService';
import './DocumentManager.css';

const DocumentManager = ({ clientId }) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [fileToUpload, setFileToUpload] = useState(null);

    useEffect(() => {
        if (clientId) {
            fetchDocuments();
        } else {
            console.warn('DocumentManager: No client ID provided');
            setDocuments([]);
            setLoading(false);
        }
    }, [clientId]);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const docs = await documentService.getDocuments(clientId);
            setDocuments(docs);
            setError(null);
        } catch (err) {
            console.error('Error fetching documents:', err);
            setError('Failed to load documents. Please try again.');
            setDocuments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFileToUpload(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!fileToUpload) {
            setError('Please select a file to upload');
            return;
        }

        // Validate file type
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'image/jpeg',
            'image/png'
        ];
        
        if (!allowedTypes.includes(fileToUpload.type)) {
            setError('Invalid file type. Only PDF, Word, Excel, and image files are allowed.');
            return;
        }
        
        // Validate file size (max 10MB)
        if (fileToUpload.size > 10 * 1024 * 1024) {
            setError('File too large. Maximum file size is 10MB.');
            return;
        }

        try {
            setUploading(true);
            setError(null);
            await documentService.uploadDocument(clientId, fileToUpload);
            setFileToUpload(null);
            // Reset the file input
            const fileInput = document.getElementById('document-upload');
            if (fileInput) {
                fileInput.value = '';
            }
            await fetchDocuments();
        } catch (err) {
            console.error('Error uploading document:', err);
            setError('Failed to upload document. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (documentId) => {
        if (window.confirm('Are you sure you want to delete this document?')) {
            try {
                setError(null);
                await documentService.deleteDocument(clientId, documentId);
                
                // Update the local state to remove the deleted document
                setDocuments(prevDocuments => 
                    prevDocuments.filter(doc => doc._id !== documentId)
                );
                
            } catch (err) {
                console.error('Error deleting document:', err);
                setError('Failed to delete document. Please try again.');
                // Refresh the document list to ensure UI is in sync with server
                fetchDocuments();
            }
        }
    };

    const handleViewDocument = async (documentId, documentName) => {
        try {
            setError(null);
            await documentService.downloadDocument(clientId, documentId, documentName);
        } catch (err) {
            console.error('Error viewing document:', err);
            setError('Failed to view document. Please try again.');
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' bytes';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else return (bytes / 1048576).toFixed(1) + ' MB';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getFileIcon = (type) => {
        if (type.includes('pdf')) return '📄';
        else if (type.includes('word')) return '📝';
        else if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
        else if (type.includes('image')) return '🖼️';
        else return '📎';
    };

    return (
        <div className="document-manager">
            <div className="document-upload">
                <h3>Upload Document</h3>
                {error && <div className="error-message">{error}</div>}
                
                <div className="upload-controls">
                    <input 
                        type="file" 
                        onChange={handleFileChange}
                        className="file-input"
                        id="document-upload"
                        disabled={uploading}
                    />
                    <label htmlFor="document-upload" className={`file-label ${uploading ? 'disabled' : ''}`}>
                        {fileToUpload ? fileToUpload.name : 'Choose File'}
                    </label>
                    
                    <button 
                        className="upload-button"
                        onClick={handleUpload}
                        disabled={!fileToUpload || uploading}
                    >
                        {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                </div>
                <p className="upload-note">
                    Accepted formats: PDF, Word, Excel, and images (up to 10MB)
                </p>
                {uploading && (
                    <div className="upload-progress">
                        <div className="progress-indicator"></div>
                        <p>Uploading document, please wait...</p>
                    </div>
                )}
            </div>
            
            <div className="document-list">
                <h3>Client Documents</h3>
                
                {loading ? (
                    <div className="loading-indicator">Loading documents...</div>
                ) : documents.length === 0 ? (
                    <p className="no-documents">No documents uploaded yet</p>
                ) : (
                    <div className="documents-table-container">
                        <table className="documents-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th>Size</th>
                                    <th>Uploaded</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {documents.map(doc => (
                                    <tr key={doc._id}>
                                        <td className="document-name">
                                            <span className="file-icon">{getFileIcon(doc.type)}</span>
                                            {doc.name}
                                        </td>
                                        <td>{doc.type.split('/')[1].toUpperCase()}</td>
                                        <td>{formatFileSize(doc.size)}</td>
                                        <td>{formatDate(doc.uploadedAt)}</td>                                            <td className="document-actions">
                                            <button 
                                                className="action-button view-button"
                                                onClick={() => handleViewDocument(doc._id, doc.name)}
                                            >
                                                View
                                            </button>
                                            <button 
                                                className="action-button delete-button"
                                                onClick={() => handleDelete(doc._id)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentManager;
