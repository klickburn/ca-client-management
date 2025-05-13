import React from 'react';
import DocumentManager from './DocumentManager';
import './ClientDetail.css';

const ClientDetail = ({ client, onEdit, onBack }) => {
    if (!client) {
        return <div className="client-detail-loading">Loading client details...</div>;
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="client-detail-container">
            <div className="client-detail-header">
                <button 
                    className="back-button"
                    onClick={onBack}
                >
                    ← Back to Clients
                </button>
                <button 
                    className="edit-button"
                    onClick={() => onEdit(client)}
                >
                    Edit Client
                </button>
            </div>

            <div className="client-detail-card">
                <div className="client-detail-primary">
                    <h1 className="client-name">{client.name}</h1>
                    <span className="client-type">{client.clientType}</span>
                </div>

                <div className="client-detail-grid">
                    <div className="detail-section">
                        <h3>Contact Information</h3>
                        <div className="detail-item">
                            <span className="detail-label">Email:</span>
                            <span className="detail-value">
                                <a href={`mailto:${client.email}`}>{client.email}</a>
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Phone:</span>
                            <span className="detail-value">
                                <a href={`tel:${client.phone}`}>{client.phone}</a>
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Address:</span>
                            <span className="detail-value">{client.address}</span>
                        </div>
                    </div>

                    <div className="detail-section">
                        <h3>Business Information</h3>
                        {client.panNumber && (
                            <div className="detail-item">
                                <span className="detail-label">PAN Number:</span>
                                <span className="detail-value">{client.panNumber}</span>
                            </div>
                        )}
                        {client.gstNumber && (
                            <div className="detail-item">
                                <span className="detail-label">GST Number:</span>
                                <span className="detail-value">{client.gstNumber}</span>
                            </div>
                        )}
                        <div className="detail-item">
                            <span className="detail-label">Created:</span>
                            <span className="detail-value">{formatDate(client.createdAt)}</span>
                        </div>
                    </div>
                </div>

                {client.services && client.services.length > 0 && (
                    <div className="detail-section">
                        <h3>Services</h3>
                        <div className="services-list">
                            {client.services.map(service => (
                                <span key={service} className="service-tag">
                                    {service}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {client.notes && (
                    <div className="detail-section notes-section">
                        <h3>Notes</h3>
                        <div className="notes-content">
                            {client.notes}
                        </div>
                    </div>
                )}
            </div>
            
            {/* Document Manager Section */}
            {client._id ? (
                <DocumentManager clientId={client._id} />
            ) : (
                <div className="document-manager-error">
                    <p>Cannot load document manager - missing client ID.</p>
                </div>
            )}
        </div>
    );
};

export default ClientDetail;
