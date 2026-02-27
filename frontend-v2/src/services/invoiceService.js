import api from './api';

export const invoiceService = {
  async getInvoices(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.clientId) params.set('clientId', filters.clientId);
    const response = await api.get(`/invoices?${params}`);
    return response.data;
  },

  async getInvoice(invoiceId) {
    const response = await api.get(`/invoices/${invoiceId}`);
    return response.data;
  },

  async getInvoiceStats() {
    const response = await api.get('/invoices/stats');
    return response.data;
  },

  async createInvoice(invoiceData) {
    const response = await api.post('/invoices', invoiceData);
    return response.data;
  },

  async updateInvoice(invoiceId, invoiceData) {
    const response = await api.put(`/invoices/${invoiceId}`, invoiceData);
    return response.data;
  },

  async recordPayment(invoiceId, amount) {
    const response = await api.post(`/invoices/${invoiceId}/payment`, { amount });
    return response.data;
  },

  async deleteInvoice(invoiceId) {
    await api.delete(`/invoices/${invoiceId}`);
  },
};
