import api from './api';

export const activityService = {
  async getActivities(filters = {}) {
    const params = new URLSearchParams();
    if (filters.limit) params.set('limit', filters.limit);
    if (filters.skip) params.set('skip', filters.skip);
    if (filters.targetType) params.set('targetType', filters.targetType);
    if (filters.targetId) params.set('targetId', filters.targetId);
    if (filters.performedBy) params.set('performedBy', filters.performedBy);
    if (filters.action) params.set('action', filters.action);
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    if (filters.search) params.set('search', filters.search);
    const response = await api.get(`/activities?${params}`);
    return response.data;
  },
};
