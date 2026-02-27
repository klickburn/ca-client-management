import api from './api';

export const notificationService = {
  async getNotifications() {
    const response = await api.get('/notifications');
    return response.data;
  },

  async getUnreadCount() {
    const response = await api.get('/notifications/unread-count');
    return response.data.count;
  },

  async markAsRead(notificationId) {
    await api.put(`/notifications/${notificationId}/read`);
  },

  async markAllRead() {
    await api.put('/notifications/read-all');
  },
};
