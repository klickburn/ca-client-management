import api from './api';

// Dynamic API path for auth
const AUTH_PATH = 'auth/'; 

const login = async (username, password) => {
    try {
        console.log('Login attempt with:', { username, url: api.defaults.baseURL + AUTH_PATH + 'login' });
        const response = await api.post(AUTH_PATH + 'login', {
            username,
            password
        });
        if (response.data && response.data.token) {
            localStorage.setItem('user', JSON.stringify(response.data));
            console.log('Login successful, token stored');
        } else {
            console.warn('Login response missing token:', response.data);
        }
        return response.data;
    } catch (error) {
        console.error('Login error:', error.response?.data || error.message);
        throw error;
    }
};

const logout = () => {
    localStorage.removeItem('user');
};

const register = async (username, password, role) => {
    try {
        const response = await api.post(AUTH_PATH + 'register', {
            username,
            password,
            role
        });
        return response.data;
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
};

const getCurrentUser = () => {
    try {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
        console.error('Error getting current user:', error);
        localStorage.removeItem('user'); // Clear corrupt data
        return null;
    }
};

export const authService = {
    login,
    logout,
    register,
    getCurrentUser
};