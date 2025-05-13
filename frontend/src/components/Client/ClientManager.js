import React, { useState, useEffect } from 'react';
import ClientList from './ClientList';
import ClientForm from './ClientForm';
import ClientDetail from './ClientDetail';
import clientService from '../../services/clientService';
import './ClientManager.css';

const VIEW_MODES = {
    LIST: 'list',
    CREATE: 'create',
    EDIT: 'edit',
    DETAIL: 'detail'
};

const ClientManager = () => {
    const [viewMode, setViewMode] = useState(VIEW_MODES.LIST);
    const [selectedClient, setSelectedClient] = useState(null);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const data = await clientService.getClients();
            setClients(data);
            setError(null);
        } catch (err) {
            setError('Error fetching clients. Please try again later.');
            console.error('Error fetching clients:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleClientSelect = (client) => {
        setSelectedClient(client);
        setViewMode(VIEW_MODES.DETAIL);
    };

    const handleCreateClient = () => {
        setSelectedClient(null);
        setViewMode(VIEW_MODES.CREATE);
    };

    const handleEditClient = (client) => {
        setSelectedClient(client);
        setViewMode(VIEW_MODES.EDIT);
    };

    const handleBack = () => {
        setViewMode(VIEW_MODES.LIST);
        fetchClients(); // Refresh the client list when returning
    };

    const handleSaveClient = (client) => {
        fetchClients(); // Refresh the client list after save
        setViewMode(VIEW_MODES.DETAIL);
        setSelectedClient(client);
    };

    const handleDeleteClient = async (clientId) => {
        if (window.confirm('Are you sure you want to delete this client?')) {
            try {
                await clientService.deleteClient(clientId);
                fetchClients(); // Refresh the client list after deletion
                setViewMode(VIEW_MODES.LIST); // Return to list view
                setError(null);
            } catch (err) {
                setError('Error deleting client. Please try again.');
                console.error('Error deleting client:', err);
            }
        }
    };

    const renderContent = () => {
        switch (viewMode) {
            case VIEW_MODES.CREATE:
                return (
                    <ClientForm
                        onSave={handleSaveClient}
                        onCancel={handleBack}
                    />
                );
            case VIEW_MODES.EDIT:
                return (
                    <ClientForm
                        client={selectedClient}
                        onSave={handleSaveClient}
                        onCancel={handleBack}
                    />
                );
            case VIEW_MODES.DETAIL:
                return (
                    <ClientDetail
                        client={selectedClient}
                        onEdit={handleEditClient}
                        onBack={handleBack}
                    />
                );
            case VIEW_MODES.LIST:
            default:
                return (
                    <ClientList
                        onClientSelect={handleClientSelect}
                        onCreateClient={handleCreateClient}
                    />
                );
        }
    };

    return (
        <div className="client-manager">
            {error && (
                <div className="error-notification">
                    {error}
                    <button onClick={() => setError(null)}>Dismiss</button>
                </div>
            )}
            {renderContent()}
        </div>
    );
};

export default ClientManager;
