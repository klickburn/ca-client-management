import api from './api';

const documentService = {
    /**
     * Upload a document for a client
     * 
     * @param {string} clientId - The ID of the client
     * @param {File} file - The file to upload
     * @returns {Promise} - Promise with uploaded document data
     */
    uploadDocument: async (clientId, file) => {
        try {
            const formData = new FormData();
            formData.append('document', file);
            
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
     * Get all documents for a client
     * 
     * @param {string} clientId - The ID of the client
     * @returns {Promise} - Promise with array of documents
     */
    getDocuments: async (clientId) => {
        try {
            if (!clientId) {
                console.error('getDocuments: No client ID provided');
                return [];
            }
            const response = await api.get(`/clients/${clientId}/documents`);
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
                responseType: 'blob'
            });
            
            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', documentName || 'document');
            
            // Append to html link element
            document.body.appendChild(link);
            
            // Trigger download
            link.click();
            
            // Clean up and remove the link
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error downloading document:', error);
            throw error;
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
