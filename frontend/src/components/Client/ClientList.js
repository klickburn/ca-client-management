import React, { useState, useEffect } from 'react';
import clientService from '../../services/clientService';
import './ClientList.css';

const ClientList = ({ onClientSelect, onCreateClient }) => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
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

    const handleDeleteClient = async (clientId) => {
        if (window.confirm('Are you sure you want to delete this client?')) {
            try {
                await clientService.deleteClient(clientId);
                setClients(clients.filter(client => client._id !== clientId));
            } catch (err) {
                setError('Error deleting client. Please try again.');
                console.error('Error deleting client:', err);
            }
        }
    };

    // Filter clients based on search term
    const filteredClients = clients.filter(client => 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm) ||
        (client.panNumber && client.panNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (client.gstNumber && client.gstNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="client-list-container">
            <div className="client-list-header">
                <h2>Clients</h2>
                <button 
                    className="create-client-button"
                    onClick={onCreateClient}
                >
                    Add New Client
                </button>
            </div>

            <div className="client-search">
                <input 
                    type="text"
                    placeholder="Search clients by name, email, phone, PAN, or GST..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {error && <div className="error-message">{error}</div>}
            
            {loading ? (
                <div className="loading-spinner">Loading clients...</div>
            ) : (
                <>
                    {filteredClients.length === 0 ? (
                        <p className="no-clients-message">
                            {searchTerm 
                                ? 'No clients found matching your search.' 
                                : 'No clients found. Click "Add New Client" to create one.'}
                        </p>
                    ) : (
                        <div className="client-grid">
                            {filteredClients.map(client => (
                                <div key={client._id} className="client-card">
                                    <div className="client-name">{client.name}</div>
                                    <div className="client-type">{client.clientType}</div>
                                    <div className="client-details">
                                        <div className="client-detail">📧 {client.email}</div>
                                        <div className="client-detail">📞 {client.phone}</div>
                                        {client.panNumber && (
                                            <div className="client-detail">🪪 PAN: {client.panNumber}</div>
                                        )}
                                        {client.gstNumber && (
                                            <div className="client-detail">📝 GST: {client.gstNumber}</div>
                                        )}
                                    </div>
                                    <div className="client-actions">
                                        <button 
                                            className="action-button view-button"
                                            onClick={() => onClientSelect(client)}
                                        >
                                            View Details
                                        </button>
                                        <button 
                                            className="action-button delete-button"
                                            onClick={() => handleDeleteClient(client._id)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ClientList;
