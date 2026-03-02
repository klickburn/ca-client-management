import api from './api';

export const reportService = {
  async getDashboardStats(filters = {}) {
    const params = new URLSearchParams();
    if (filters.fiscalYear) params.set('fiscalYear', filters.fiscalYear);
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    const response = await api.get(`/reports/dashboard?${params}`);
    return response.data;
  },
};
