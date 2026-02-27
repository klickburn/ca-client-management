import api from './api';

export const dscService = {
  async getDSCs(filters = {}) {
    const params = new URLSearchParams();
    if (filters.clientId) params.set('clientId', filters.clientId);
    if (filters.status) params.set('status', filters.status);
    if (filters.expiringSoon) params.set('expiringSoon', 'true');
    const response = await api.get(`/dsc?${params}`);
    return response.data;
  },

  async getDSCStats() {
    const response = await api.get('/dsc/stats');
    return response.data;
  },

  async createDSC(data) {
    const response = await api.post('/dsc', data);
    return response.data;
  },

  async updateDSC(id, data) {
    const response = await api.put(`/dsc/${id}`, data);
    return response.data;
  },

  async deleteDSC(id) {
    await api.delete(`/dsc/${id}`);
  },
};
