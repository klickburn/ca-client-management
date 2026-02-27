import api from './api';

export const activityService = {
  async getActivities(filters = {}) {
    const params = new URLSearchParams();
    if (filters.limit) params.set('limit', filters.limit);
    if (filters.targetType) params.set('targetType', filters.targetType);
    if (filters.targetId) params.set('targetId', filters.targetId);
    const response = await api.get(`/activities?${params}`);
    return response.data;
  },
};
