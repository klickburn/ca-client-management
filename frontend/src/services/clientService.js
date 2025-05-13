import api from './api';

const clientService = {
    getClients: async () => {
        try {
            const response = await api.get('/clients');
            return response.data;
        } catch (error) {
            console.error('Error fetching clients:', error.response || error);
            throw error;
        }
    },

    getClient: async (clientId) => {
        try {
            const response = await api.get(`/clients/${clientId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching client details:', error.response || error);
            throw error;
        }
    },

    createClient: async (clientData) => {
        try {
            const response = await api.post('/clients', clientData);
            return response.data;
        } catch (error) {
            console.error('Error creating client:', error.response || error);
            throw error;
        }
    },

    updateClient: async (clientId, clientData) => {
        try {
            const response = await api.put(`/clients/${clientId}`, clientData);
            return response.data;
        } catch (error) {
            console.error('Error updating client:', error.response || error);
            throw error;
        }
    },

    deleteClient: async (clientId) => {
        try {
            const response = await api.delete(`/clients/${clientId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting client:', error.response || error);
            throw error;
        }
    }
};

export default clientService;