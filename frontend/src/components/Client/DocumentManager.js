import React, { useState, useEffect, useContext } from 'react';
import documentService from '../../services/documentService';
import { AuthContext } from '../../context/AuthContext';
import './DocumentManager.css';

// Document categories
const documentCategories = [
    'Statement',
    'Ledgers',
    'Financials',
    'Returns',
    'Vendor Registration',
    'Property Details',
    'Other'
];

// Generate fiscal years (current year and 10 years back)
const generateFiscalYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 11; i++) {
        const year = currentYear - i;
        years.push(`${year-1}-${year}`);
    }
    return years;
};

const fiscalYears = generateFiscalYears();

const DocumentManager = ({ clientId }) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [fileToUpload, setFileToUpload] = useState(null);
    const { user } = useContext(AuthContext);
    
    // New state for document filters and metadata
    const [documentCategory, setDocumentCategory] = useState('Other');
    const [documentFiscalYear, setDocumentFiscalYear] = useState(fiscalYears[0]);
    const [documentNotes, setDocumentNotes] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterFiscalYear, setFilterFiscalYear] = useState('');

    useEffect(() => {
        if (clientId) {
            fetchDocuments();
        } else {
            console.warn('DocumentManager: No client ID provided');
            setDocuments([]);
            setLoading(false);
        }
    }, [clientId, filterCategory, filterFiscalYear]);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            // Pass filter parameters to the API
            const docs = await documentService.getDocuments(clientId, filterCategory, filterFiscalYear);
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
            
            // Include metadata with the upload
            await documentService.uploadDocument(
                clientId, 
                fileToUpload, 
                documentCategory, 
                documentFiscalYear, 
                documentNotes
            );
            
            // Reset form
            setFileToUpload(null);
            setDocumentCategory('Other');
            setDocumentFiscalYear(fiscalYears[0]);
            setDocumentNotes('');
            
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
        // Only allow admins to delete documents
        if (!user || user.role !== 'admin') {
            setError('Only administrators can delete documents');
            return;
        }
        
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
            const errorMessage = err.message || 'Failed to view document. Please try again.';
            setError(errorMessage);
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
                
                <div className="upload-form">
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
                    </div>
                    
                    <div className="upload-metadata">
                        <div className="form-group">
                            <label htmlFor="documentCategory">Category:</label>
                            <select
                                id="documentCategory"
                                value={documentCategory}
                                onChange={(e) => setDocumentCategory(e.target.value)}
                                disabled={uploading}
                            >
                                {documentCategories.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="documentFiscalYear">Fiscal Year:</label>
                            <select
                                id="documentFiscalYear"
                                value={documentFiscalYear}
                                onChange={(e) => setDocumentFiscalYear(e.target.value)}
                                disabled={uploading}
                            >
                                <option value="">Select Year</option>
                                {fiscalYears.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="documentNotes">Notes:</label>
                        <textarea
                            id="documentNotes"
                            value={documentNotes}
                            onChange={(e) => setDocumentNotes(e.target.value)}
                            placeholder="Add notes about this document"
                            disabled={uploading}
                        />
                    </div>
                    
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
                
                {error && <div className="error-message">{error}</div>}
                
                {/* Document filters */}
                <div className="document-filters">
                    <div className="filter-group">
                        <label htmlFor="filterCategory">Filter by Category:</label>
                        <select
                            id="filterCategory"
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                        >
                            <option value="">All Categories</option>
                            {documentCategories.map(category => (
                                <option key={category} value={category}>{category}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="filter-group">
                        <label htmlFor="filterFiscalYear">Filter by Fiscal Year:</label>
                        <select
                            id="filterFiscalYear"
                            value={filterFiscalYear}
                            onChange={(e) => setFilterFiscalYear(e.target.value)}
                        >
                            <option value="">All Years</option>
                            {fiscalYears.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                    
                    <button 
                        className="clear-filters-button"
                        onClick={() => {
                            setFilterCategory('');
                            setFilterFiscalYear('');
                        }}
                        disabled={!filterCategory && !filterFiscalYear}
                    >
                        Clear Filters
                    </button>
                </div>
                
                {loading ? (
                    <div className="loading-indicator">Loading documents...</div>
                ) : documents.length === 0 ? (
                    <p className="no-documents">No documents found matching the current filters</p>
                ) : (
                    <div className="documents-table-container">
                        <table className="documents-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Category</th>
                                    <th>Fiscal Year</th>
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
                                            <div>
                                                <div>{doc.name}</div>
                                                {doc.notes && <div className="document-notes">{doc.notes}</div>}
                                            </div>
                                        </td>
                                        <td>{doc.category || 'Other'}</td>
                                        <td>{doc.fiscalYear || '-'}</td>
                                        <td>{doc.type.split('/')[1].toUpperCase()}</td>
                                        <td>{formatFileSize(doc.size)}</td>
                                        <td>{formatDate(doc.uploadedAt)}</td>                                            
                                        <td className="document-actions">
                                            <button 
                                                className="action-button view-button"
                                                onClick={() => handleViewDocument(doc._id, doc.name)}
                                                title="Download this file to your computer"
                                            >
                                                Download
                                            </button>
                                            <a 
                                                href={documentService.getDocumentUrl(clientId, doc._id)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="action-button view-online-button"
                                                title="View this file in a new tab"
                                            >
                                                View
                                            </a>
                                            {user && user.role === 'admin' && (
                                                <button 
                                                    className="action-button delete-button"
                                                    onClick={() => handleDelete(doc._id)}
                                                    title="Delete this document permanently"
                                                >
                                                    Delete
                                                </button>
                                            )}
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
