import React from 'react';
import ClientManager from '../Client/ClientManager';
import './AdminDashboard.css'; // Reuse dashboard CSS for consistent styling

const ClientPage = () => {
    return (
        <div className="client-page">
            <h1>Client Management</h1>
            <ClientManager />
        </div>
    );
};

export default ClientPage;
