import api from './api';

export const complianceService = {
  async getCalendar(fiscalYear) {
    const params = fiscalYear ? `?fiscalYear=${fiscalYear}` : '';
    const response = await api.get(`/compliance/calendar${params}`);
    return response.data;
  },

  async generateTasks(fiscalYear, month) {
    const response = await api.post('/compliance/generate-tasks', { fiscalYear, month });
    return response.data;
  },

  async sendDeadlineAlerts() {
    const response = await api.post('/compliance/send-alerts');
    return response.data;
  },

  async getChecklists() {
    const response = await api.get('/compliance/checklists');
    return response.data;
  },

  async getChecklist(taskType, clientId) {
    const params = new URLSearchParams({ taskType });
    if (clientId) params.set('clientId', clientId);
    const response = await api.get(`/compliance/checklist?${params}`);
    return response.data;
  },

  async validatePAN(pan) {
    const response = await api.get(`/compliance/validate-pan?pan=${pan}`);
    return response.data;
  },

  async validateGSTIN(gstin) {
    const response = await api.get(`/compliance/validate-gstin?gstin=${gstin}`);
    return response.data;
  },
};
