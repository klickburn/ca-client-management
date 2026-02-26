import api from './api';
import axios from 'axios';

export const documentService = {
  // Step 1: Get presigned upload URL from backend
  async getUploadUrl(clientId, { filename, contentType, category, fiscalYear, notes }) {
    const response = await api.post(`/clients/${clientId}/documents/upload-url`, {
      filename, contentType, category, fiscalYear, notes,
    });
    return response.data; // { uploadUrl, documentId, r2Key }
  },

  // Step 2: Upload directly to R2
  async uploadToR2(uploadUrl, file, onProgress) {
    await axios.put(uploadUrl, file, {
      headers: { 'Content-Type': file.type },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    });
  },

  // Step 3: Confirm upload completed
  async confirmUpload(clientId, documentId, size) {
    const response = await api.post(`/clients/${clientId}/documents/${documentId}/confirm`, { size });
    return response.data;
  },

  // Full upload flow
  async uploadDocument(clientId, file, metadata, onProgress) {
    const { uploadUrl, documentId } = await this.getUploadUrl(clientId, {
      filename: file.name,
      contentType: file.type,
      ...metadata,
    });
    await this.uploadToR2(uploadUrl, file, onProgress);
    await this.confirmUpload(clientId, documentId, file.size);
    return documentId;
  },

  async getDocuments(clientId, filters = {}) {
    const params = new URLSearchParams();
    if (filters.category) params.set('category', filters.category);
    if (filters.fiscalYear) params.set('fiscalYear', filters.fiscalYear);
    const response = await api.get(`/clients/${clientId}/documents?${params}`);
    return response.data;
  },

  async getDownloadUrl(clientId, documentId) {
    const response = await api.get(`/clients/${clientId}/documents/${documentId}/download-url`);
    return response.data.downloadUrl;
  },

  async downloadDocument(clientId, documentId) {
    const url = await this.getDownloadUrl(clientId, documentId);
    window.open(url, '_blank');
  },

  async verifyDocument(clientId, documentId) {
    const response = await api.put(`/clients/${clientId}/documents/${documentId}/verify`);
    return response.data;
  },

  async rejectDocument(clientId, documentId, reason) {
    const response = await api.put(`/clients/${clientId}/documents/${documentId}/reject`, { reason });
    return response.data;
  },

  async deleteDocument(clientId, documentId) {
    await api.delete(`/clients/${clientId}/documents/${documentId}`);
  },
};
