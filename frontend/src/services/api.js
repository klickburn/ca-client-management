import axios from 'axios';

// Dynamically determine the API URL based on environment
const getApiUrl = () => {
    // In production, use relative URLs to the same domain
    if (process.env.NODE_ENV === 'production') {
        return '/api';
    }
    // In development, use the localhost URL
    return 'http://localhost:5001/api';
};

const API_URL = getApiUrl();

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the auth token in every request
api.interceptors.request.use(
    (config) => {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                if (user && user.token) {
                    config.headers.Authorization = `Bearer ${user.token}`;
                }
            }
        } catch (error) {
            console.error('Error setting auth header:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response) {
            if (error.response.status === 401) {
                // Token expired or invalid, logout the user
                localStorage.removeItem('user');
                window.location.href = '/login';
            } else if (error.response.status === 403) {
                console.error('Permission denied. Please check your access rights.');
            } else if (error.response.status === 500) {
                console.error('Server error:', error.response.data);
            }
        } else if (error.request) {
            // The request was made but no response was received
            console.error('No response received from server:', error.request);
        } else {
            // Something happened in setting up the request that triggered an error
            console.error('Error setting up request:', error.message);
        }
        return Promise.reject(error);
    }
);

// Example API call to login
export const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
};

// Example API call to create a user
export const createUser = async (userData) => {
    const response = await api.post('/users/create', userData);
    return response.data;
};

// Example API call to get users
export const getUsers = async () => {
    const response = await api.get('/users');
    return response.data;
};

// Example API call to get clients
export const getClients = async () => {
    const response = await api.get('/clients');
    return response.data;
};

// API call to delete a user
export const deleteUser = async (userId) => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
};

// API call to view a user's password
export const getUserPassword = async (userId) => {
    const response = await api.get(`/users/password/${userId}`);
    return response.data;
};

export default api;