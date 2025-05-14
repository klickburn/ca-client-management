import api from './api';

const documentService = {
    /**
     * Upload a document for a client
     * 
     * @param {string} clientId - The ID of the client
     * @param {File} file - The file to upload
     * @param {string} category - Document category
     * @param {string} fiscalYear - Fiscal year related to the document
     * @param {string} notes - Additional notes about the document
     * @returns {Promise} - Promise with uploaded document data
     */
    uploadDocument: async (clientId, file, category = 'Other', fiscalYear = '', notes = '') => {
        try {
            const formData = new FormData();
            formData.append('document', file);
            formData.append('category', category);
            formData.append('fiscalYear', fiscalYear);
            formData.append('notes', notes);
            
            // Get auth token
            const user = JSON.parse(localStorage.getItem('user'));
            
            const response = await api.post(`/clients/${clientId}/documents`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': user && user.token ? `Bearer ${user.token}` : ''
                }
            });
            return response.data;
        } catch (error) {
            console.error('Document upload error:', error.response || error);
            throw error;
        }
    },

    /**
     * Get all documents for a client with optional filtering
     * 
     * @param {string} clientId - The ID of the client
     * @param {string} category - Optional category filter
     * @param {string} fiscalYear - Optional fiscal year filter
     * @returns {Promise} - Promise with array of documents
     */
    getDocuments: async (clientId, category = '', fiscalYear = '') => {
        try {
            if (!clientId) {
                console.error('getDocuments: No client ID provided');
                return [];
            }
            
            // Build query params for filtering
            let url = `/clients/${clientId}/documents`;
            const params = [];
            
            if (category) {
                params.push(`category=${encodeURIComponent(category)}`);
            }
            
            if (fiscalYear) {
                params.push(`fiscalYear=${encodeURIComponent(fiscalYear)}`);
            }
            
            if (params.length > 0) {
                url += `?${params.join('&')}`;
            }
            
            const response = await api.get(url);
            return response.data;
        } catch (error) {
            console.error('Error getting documents:', error.response || error);
            throw error;
        }
    },

    /**
     * Get document download URL
     * 
     * @param {string} clientId - The ID of the client
     * @param {string} documentId - The ID of the document
     * @returns {string} - URL to download the document
     */
    getDocumentUrl: (clientId, documentId) => {
        // Get auth token
        const user = JSON.parse(localStorage.getItem('user'));
        const token = user && user.token ? user.token : '';
        return `${api.defaults.baseURL}/clients/${clientId}/documents/${documentId}?token=${token}`;
    },
    
    /**
     * Download a document
     * 
     * @param {string} clientId - The ID of the client
     * @param {string} documentId - The ID of the document
     */
    downloadDocument: async (clientId, documentId, documentName) => {
        try {
            const response = await api.get(`/clients/${clientId}/documents/${documentId}`, {
                responseType: 'blob',
                timeout: 30000 // Increase timeout for large files
            });
            
            // Get content type from response
            const contentType = response.headers['content-type'] || 'application/octet-stream';
            
            // Create blob link to download with the correct type
            const blob = new Blob([response.data], { type: contentType });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            // Use the filename from Content-Disposition header if available, otherwise fallback to provided name
            const contentDisposition = response.headers['content-disposition'];
            let filename = documentName || 'document';
            
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+?)"/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = decodeURIComponent(filenameMatch[1]);
                }
            }
            
            link.setAttribute('download', filename);
            
            // Append to html link element
            document.body.appendChild(link);
            
            // Trigger download
            link.click();
            
            // Clean up and remove the link
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading document:', error);
            // Check for specific error types
            if (error.response) {
                if (error.response.status === 404) {
                    throw new Error('Document not found on server');
                } else {
                    throw new Error(`Server error: ${error.response.status}`);
                }
            } else if (error.request) {
                throw new Error('No response from server. Check your network connection.');
            } else {
                throw error;
            }
        }
    },

    /**
     * Delete a document
     * 
     * @param {string} clientId - The ID of the client
     * @param {string} documentId - The ID of the document
     * @returns {Promise} - Promise indicating success
     */
    deleteDocument: async (clientId, documentId) => {
        try {
            if (!clientId || !documentId) {
                console.error('deleteDocument: Missing client ID or document ID');
                throw new Error('Missing required parameters');
            }
            const response = await api.delete(`/clients/${clientId}/documents/${documentId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting document:', error.response || error);
            throw error;
        }
    }
};

export default documentService;
