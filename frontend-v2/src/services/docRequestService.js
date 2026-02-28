import api from './api';

export const docRequestService = {
  async getRequests(clientId) {
    const response = await api.get(`/doc-requests/${clientId}`);
    return response.data;
  },

  async createRequest(clientId, data) {
    const response = await api.post(`/doc-requests/${clientId}`, data);
    return response.data;
  },

  async updateRequest(requestId, data) {
    const response = await api.put(`/doc-requests/${requestId}`, data);
    return response.data;
  },

  async fulfillItem(requestId, itemIndex, documentId) {
    const response = await api.put(`/doc-requests/${requestId}/fulfill/${itemIndex}`, { documentId });
    return response.data;
  },

  async deleteRequest(requestId) {
    await api.delete(`/doc-requests/${requestId}`);
  },
};
