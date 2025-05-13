import React, { useState, useEffect } from 'react';
import './UserForm.css';

const initialFormState = {
    username: '',
    password: '',
    role: 'user'
};

const UserForm = ({ user, onSave, onCancel }) => {
    const [formData, setFormData] = useState(initialFormState);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const isEditMode = !!user?._id;

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username || '',
                password: '',  // Don't fill password field for security
                role: user.role || 'user'
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Clear error when field is updated
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
        } else if (formData.username.trim().length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        }
        
        if (!isEditMode && !formData.password.trim()) {
            newErrors.password = 'Password is required';
        } else if (!isEditMode && formData.password.trim().length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        setLoading(true);
        setSubmitError(null);
        
        try {
            // Only include password in payload if it's provided
            const userData = {
                username: formData.username,
                role: formData.role
            };
            
            if (formData.password.trim()) {
                userData.password = formData.password;
            }
            
            await onSave(userData, isEditMode);
        } catch (error) {
            console.error('Error saving user:', error);
            setSubmitError(
                error.response?.data?.message || 
                'Error saving user. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="user-form-container">
            <h2>{isEditMode ? 'Edit User' : 'Create New User'}</h2>
            
            {submitError && (
                <div className="error-message">{submitError}</div>
            )}
            
            <form onSubmit={handleSubmit} className="user-form">
                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className={errors.username ? 'error' : ''}
                    />
                    {errors.username && <div className="error-text">{errors.username}</div>}
                </div>
                
                <div className="form-group">
                    <label htmlFor="password">
                        {isEditMode ? 'New Password (leave blank to keep current)' : 'Password'}
                    </label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={errors.password ? 'error' : ''}
                    />
                    {errors.password && <div className="error-text">{errors.password}</div>}
                </div>
                
                <div className="form-group">
                    <label htmlFor="role">Role</label>
                    <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                    >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                
                <div className="form-actions">
                    <button 
                        type="button" 
                        className="cancel-button"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        className="save-button"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : isEditMode ? 'Update User' : 'Create User'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UserForm;
