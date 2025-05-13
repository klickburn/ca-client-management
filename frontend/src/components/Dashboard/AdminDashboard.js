import React from 'react';
import { useEffect, useState, useRef } from 'react';
import { getUsers, deleteUser, getUserPassword } from '../../services/api';
import UserCreate from '../User/UserCreate';
import UserForm from '../User/UserForm';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [clients, setClients] = useState([]);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalClients: 0,
        activeClients: 0
    });
    const [isAddingUser, setIsAddingUser] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [passwordView, setPasswordView] = useState({
        userId: null,
        username: '',
        hashedPassword: '',
        isVisible: false,
        showPassword: false
    });
    const passwordModalRef = useRef(null);

    useEffect(() => {
        fetchUsers();
        fetchStats();
    }, []);

    useEffect(() => {
        // Add event listener for closing the password modal when clicking outside
        function handleClickOutside(event) {
            if (passwordModalRef.current && !passwordModalRef.current.contains(event.target)) {
                setPasswordView(prev => ({...prev, isVisible: false}));
            }
        }
        
        // Attach the event listener
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            // Remove the event listener on cleanup
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [passwordModalRef]);

    const fetchUsers = async () => {
        try {
            const response = await getUsers();
            setUsers(response || []);
            setStats(prevStats => ({
                ...prevStats,
                totalUsers: response ? response.length : 0
            }));
        } catch (error) {
            console.error('Error fetching users:', error);
            setErrorMessage('Failed to fetch users. Please try again.');
        }
    };

    const fetchStats = async () => {
        try {
            // In a real app, you would call an API endpoint to get dashboard stats
            // For now, we'll use sample data
            setStats({
                totalUsers: users.length,
                totalClients: 15,
                activeClients: 12
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleAddUser = () => {
        setIsAddingUser(true);
        setEditingUser(null);
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
        setIsAddingUser(false);
    };

    const handleUserSaved = () => {
        setIsAddingUser(false);
        setEditingUser(null);
        fetchUsers();
    };

    const handleCancelUserForm = () => {
        setIsAddingUser(false);
        setEditingUser(null);
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm("Are you sure you want to delete this user?")) {
            try {
                await deleteUser(userId);
                fetchUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
                setErrorMessage('Failed to delete user. Please try again.');
            }
        }
    };

    const handleViewPassword = async (userId, username) => {
        try {
            // Close the modal if clicking the same user's button when already open
            if (passwordView.isVisible && passwordView.userId === userId) {
                setPasswordView(prev => ({...prev, isVisible: false}));
                return;
            }

            const response = await getUserPassword(userId);
            setPasswordView({
                userId,
                username: response.username || username,
                hashedPassword: response.hashedPassword || 'Password not available',
                isVisible: true,
                showPassword: false
            });
        } catch (error) {
            console.error('Error fetching user password:', error);
            setErrorMessage('Failed to fetch user password. Please try again.');
        }
    };

    const togglePasswordVisibility = () => {
        setPasswordView(prev => ({...prev, showPassword: !prev.showPassword}));
    };

    return (
        <div className="admin-dashboard">
            <h1>Admin Dashboard</h1>
            
            {errorMessage && (
                <div className="error-message">
                    {errorMessage}
                    <button onClick={() => setErrorMessage('')} className="dismiss-button">×</button>
                </div>
            )}
            
            <div className="stats-cards">
                <div className="stat-card">
                    <h3>Total Users</h3>
                    <div className="stat-value">{stats.totalUsers}</div>
                </div>
                <div className="stat-card">
                    <h3>Total Clients</h3>
                    <div className="stat-value">{stats.totalClients}</div>
                </div>
                <div className="stat-card">
                    <h3>Active Clients</h3>
                    <div className="stat-value">{stats.activeClients}</div>
                </div>
            </div>
            
            {isAddingUser ? (
                <div className="card-section">
                    <div className="card-section-header">
                        <h2>Create New User</h2>
                    </div>
                    <div className="card-section-content">
                        <UserCreate onSave={handleUserSaved} onCancel={handleCancelUserForm} />
                    </div>
                </div>
            ) : editingUser ? (
                <div className="card-section">
                    <div className="card-section-header">
                        <h2>Edit User</h2>
                    </div>
                    <div className="card-section-content">
                        <UserForm 
                            user={editingUser} 
                            onSave={handleUserSaved} 
                            onCancel={handleCancelUserForm} 
                        />
                    </div>
                </div>
            ) : (
                <div className="card-section">
                    <div className="card-section-header">
                        <h2>Registered Users</h2>
                        <button className="add-user-button" onClick={handleAddUser}>
                            <i className="fas fa-plus"></i> Add User
                        </button>
                    </div>
                    <div className="card-section-content">
                        <table className="user-table">
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Role</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length > 0 ? (
                                    users.map(user => (
                                        <tr key={user._id}>
                                            <td>{user.username}</td>
                                            <td>
                                                <span className={`user-role ${user.role}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td>
                                                <button 
                                                    className="action-button edit"
                                                    onClick={() => handleEditUser(user)}
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    className="action-button delete"
                                                    onClick={() => handleDeleteUser(user._id)}
                                                >
                                                    Delete
                                                </button>
                                                <button 
                                                    className="action-button view-password"
                                                    onClick={() => handleViewPassword(user._id, user.username)}
                                                >
                                                    {passwordView.isVisible && passwordView.userId === user._id 
                                                        ? 'Hide Password' 
                                                        : 'View Password'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" style={{ textAlign: 'center' }}>No users found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Password View Modal */}
            {passwordView.isVisible && (
                <div className="password-modal-overlay">
                    <div className="password-modal" ref={passwordModalRef}>
                        <div className="password-modal-header">
                            <h3>Password for {passwordView.username}</h3>
                            <button 
                                className="dismiss-button" 
                                onClick={() => setPasswordView(prev => ({...prev, isVisible: false}))}
                            >
                                ×
                            </button>
                        </div>
                        <div className="password-modal-content">
                            <div className="password-section">
                                <div className="password-section-header">
                                    <p>Hashed Password:</p>
                                    <button 
                                        className="toggle-password-visibility" 
                                        onClick={togglePasswordVisibility}
                                    >
                                        {passwordView.showPassword ? 'Hide' : 'Show'} Password
                                    </button>
                                </div>
                                <div className="password-display">
                                    {passwordView.showPassword 
                                        ? passwordView.hashedPassword 
                                        : '••••••••••••••••••••••••••••••••••••••••'}
                                </div>
                            </div>
                            <p className="password-note">
                                <i className="fas fa-info-circle"></i> This is a hashed password. For security reasons, the actual password cannot be retrieved.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;