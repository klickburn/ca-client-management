import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import ClientManager from '../Client/ClientManager';
import './UserDashboard.css';

const UserDashboard = () => {
    const { user } = useContext(AuthContext);

    return (
        <div className="user-dashboard">
            <div className="welcome-section">
                <h1>Welcome, {user?.username || 'User'}</h1>
                <p>This is your dashboard for managing client information. Use the client manager below to view, create, edit, and manage your clients.</p>
            </div>
            
            <div className="dashboard-content">
                <ClientManager />
            </div>
        </div>
    );
};

export default UserDashboard;