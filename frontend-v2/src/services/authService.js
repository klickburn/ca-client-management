import api from './api';

export const authService = {
  async login(username, password) {
    const response = await api.post('/auth/login', { username, password });
    const userData = response.data;
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  },

  logout() {
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    const stored = localStorage.getItem('user');
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  },
};
