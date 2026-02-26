import api from './api';

export const userService = {
  async getUsers() {
    const response = await api.get('/users');
    return response.data;
  },

  async createUser(userData) {
    const response = await api.post('/users/create', userData);
    return response.data;
  },

  async assignRole(userId, role) {
    const response = await api.put('/users/role', { userId, role });
    return response.data;
  },

  async deleteUser(userId) {
    await api.delete(`/users/${userId}`);
  },
};
