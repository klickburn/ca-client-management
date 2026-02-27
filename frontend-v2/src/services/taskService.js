import api from './api';

export const taskService = {
  async getTasks(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.clientId) params.set('clientId', filters.clientId);
    if (filters.assignedTo) params.set('assignedTo', filters.assignedTo);
    if (filters.priority) params.set('priority', filters.priority);
    const response = await api.get(`/tasks?${params}`);
    return response.data;
  },

  async getTaskStats() {
    const response = await api.get('/tasks/stats');
    return response.data;
  },

  async createTask(taskData) {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },

  async updateTask(taskId, taskData) {
    const response = await api.put(`/tasks/${taskId}`, taskData);
    return response.data;
  },

  async deleteTask(taskId) {
    await api.delete(`/tasks/${taskId}`);
  },
};
