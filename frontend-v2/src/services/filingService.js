import api from './api';

export const filingService = {
  async getFilings(clientId, fiscalYear) {
    const params = fiscalYear ? { fiscalYear } : {};
    const response = await api.get(`/filings/${clientId}`, { params });
    return response.data;
  },

  async getStats(clientId, fiscalYear) {
    const params = fiscalYear ? { fiscalYear } : {};
    const response = await api.get(`/filings/${clientId}/stats`, { params });
    return response.data;
  },

  async createFiling(clientId, data) {
    const response = await api.post(`/filings/${clientId}`, data);
    return response.data;
  },

  async generateFilings(clientId, fiscalYear) {
    const response = await api.post(`/filings/${clientId}/generate`, { fiscalYear });
    return response.data;
  },

  async updateFiling(filingId, data) {
    const response = await api.put(`/filings/${filingId}`, data);
    return response.data;
  },

  async deleteFiling(filingId) {
    await api.delete(`/filings/${filingId}`);
  },
};
