import React, { useState } from 'react';
import UserForm from './UserForm';
import { createUser } from '../../services/api';
import './UserCreate.css';

const UserCreate = ({ onSave, onCancel }) => {
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSaveUser = async (userData) => {
        try {
            const response = await createUser(userData);
            setMessage('User created successfully');
            setError('');
            
            if (onSave) {
                onSave(response);
            }
            
            return response;
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Error creating user';
            setError(errorMessage);
            throw err;
        }
    };

    return (
        <div className="user-create-container">
            {message && <p className="success-message">{message}</p>}
            {error && <p className="error-message">{error}</p>}
            
            <UserForm 
                onSave={handleSaveUser} 
                onCancel={onCancel} 
            />
        </div>
    );
};

export default UserCreate;