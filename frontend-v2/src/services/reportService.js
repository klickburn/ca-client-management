import api from './api';

export const reportService = {
  async getDashboardStats() {
    const response = await api.get('/reports/dashboard');
    return response.data;
  },
};
