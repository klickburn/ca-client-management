import api from './api';

export const messageService = {
  async getMessages(clientId) {
    const response = await api.get(`/messages/${clientId}`);
    return response.data;
  },

  async sendMessage(clientId, text) {
    const response = await api.post(`/messages/${clientId}`, { text });
    return response.data;
  },

  async getUnreadCount(clientId) {
    const response = await api.get(`/messages/${clientId}/unread`);
    return response.data;
  },

  async markRead(clientId) {
    const response = await api.put(`/messages/${clientId}/read`);
    return response.data;
  },
};
