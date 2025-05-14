import React, { useState } from 'react';
import DocumentManager from './DocumentManager';
import './ClientDetail.css';

const ClientDetail = ({ client, onEdit, onBack }) => {
    const [activeTab, setActiveTab] = useState('basic');
    
    if (!client) {
        return <div className="client-detail-loading">Loading client details...</div>;
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'Not specified';
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

                <div className="detail-tabs">
                    <button 
                        className={`tab-button ${activeTab === 'basic' ? 'active' : ''}`}
                        onClick={() => setActiveTab('basic')}
                    >
                        Basic Info
                    </button>
                    <button 
                        className={`tab-button ${activeTab === 'identity' ? 'active' : ''}`}
                        onClick={() => setActiveTab('identity')}
                    >
                        ID Documents
                    </button>
                    <button 
                        className={`tab-button ${activeTab === 'credentials' ? 'active' : ''}`}
                        onClick={() => setActiveTab('credentials')}
                    >
                        Portal Credentials
                    </button>
                    <button 
                        className={`tab-button ${activeTab === 'accounts' ? 'active' : ''}`}
                        onClick={() => setActiveTab('accounts')}
                    >
                        Financial Accounts
                    </button>
                </div>

                {/* Basic Info Tab */}
                {activeTab === 'basic' && (
                    <div className="detail-tab-content">
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
                                <div className="detail-item">
                                    <span className="detail-label">Client Type:</span>
                                    <span className="detail-value">{client.clientType}</span>
                                </div>
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
                )}

                {/* Identity Tab */}
                {activeTab === 'identity' && (
                    <div className="detail-tab-content">
                        <div className="detail-section">
                            <h3>Personal Information</h3>
                            {client.dateOfBirth && (
                                <div className="detail-item">
                                    <span className="detail-label">Date of Birth:</span>
                                    <span className="detail-value">{formatDate(client.dateOfBirth)}</span>
                                </div>
                            )}
                            {client.panNumber && (
                                <div className="detail-item">
                                    <span className="detail-label">PAN Number:</span>
                                    <span className="detail-value">{client.panNumber}</span>
                                </div>
                            )}
                            {client.aadharNumber && (
                                <div className="detail-item">
                                    <span className="detail-label">Aadhar Number:</span>
                                    <span className="detail-value">{client.aadharNumber}</span>
                                </div>
                            )}
                            {client.gstNumber && (
                                <div className="detail-item">
                                    <span className="detail-label">GST Number:</span>
                                    <span className="detail-value">{client.gstNumber}</span>
                                </div>
                            )}
                            {client.tanNumber && (
                                <div className="detail-item">
                                    <span className="detail-label">TAN Number:</span>
                                    <span className="detail-value">{client.tanNumber}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Credentials Tab */}
                {activeTab === 'credentials' && (
                    <div className="detail-tab-content">
                        <div className="detail-section">
                            <h3>Government Portal Credentials</h3>
                            <p className="caution-note">Note: These credentials are stored in plain text for easy reference</p>
                            
                            {client.credentials?.incomeTax?.username && (
                                <div className="credentials-section">
                                    <h4>Income Tax Portal</h4>
                                    <div className="detail-item">
                                        <span className="detail-label">Username:</span>
                                        <span className="detail-value">{client.credentials.incomeTax.username}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Password:</span>
                                        <span className="detail-value">{client.credentials.incomeTax.password}</span>
                                    </div>
                                </div>
                            )}
                            
                            {client.credentials?.gst?.username && (
                                <div className="credentials-section">
                                    <h4>GST Portal</h4>
                                    <div className="detail-item">
                                        <span className="detail-label">Username:</span>
                                        <span className="detail-value">{client.credentials.gst.username}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Password:</span>
                                        <span className="detail-value">{client.credentials.gst.password}</span>
                                    </div>
                                </div>
                            )}
                            
                            {client.credentials?.tan?.username && (
                                <div className="credentials-section">
                                    <h4>TAN Portal</h4>
                                    <div className="detail-item">
                                        <span className="detail-label">Username:</span>
                                        <span className="detail-value">{client.credentials.tan.username}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Password:</span>
                                        <span className="detail-value">{client.credentials.tan.password}</span>
                                    </div>
                                </div>
                            )}
                            
                            {client.credentials?.traces?.username && (
                                <div className="credentials-section">
                                    <h4>Traces Portal</h4>
                                    <div className="detail-item">
                                        <span className="detail-label">Username:</span>
                                        <span className="detail-value">{client.credentials.traces.username}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Password:</span>
                                        <span className="detail-value">{client.credentials.traces.password}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Accounts Tab */}
                {activeTab === 'accounts' && (
                    <div className="detail-tab-content">
                        {/* Bank Accounts */}
                        {client.bankAccounts && client.bankAccounts.length > 0 && (
                            <div className="detail-section">
                                <h3>Bank Accounts</h3>
                                <div className="accounts-table-container">
                                    <table className="accounts-table">
                                        <thead>
                                            <tr>
                                                <th>Bank Name</th>
                                                <th>Account Number</th>
                                                <th>Account Type</th>
                                                <th>Branch</th>
                                                <th>IFSC Code</th>
                                                <th>Customer ID</th>
                                                <th>Password</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {client.bankAccounts.map((account, index) => (
                                                <tr key={index}>
                                                    <td>{account.bankName}</td>
                                                    <td>{account.accountNumber}</td>
                                                    <td>{account.accountType}</td>
                                                    <td>{account.branch}</td>
                                                    <td>{account.ifscCode}</td>
                                                    <td>{account.customerId}</td>
                                                    <td>{account.password}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Loan Accounts */}
                        {client.loanAccounts && client.loanAccounts.length > 0 && (
                            <div className="detail-section">
                                <h3>Loan Accounts</h3>
                                <div className="accounts-table-container">
                                    <table className="accounts-table">
                                        <thead>
                                            <tr>
                                                <th>Lender</th>
                                                <th>Type</th>
                                                <th>Account Number</th>
                                                <th>Amount</th>
                                                <th>Interest Rate</th>
                                                <th>Start Date</th>
                                                <th>End Date</th>
                                                <th>EMI</th>
                                                <th>Username</th>
                                                <th>Password</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {client.loanAccounts.map((account, index) => (
                                                <tr key={index}>
                                                    <td>{account.lenderName}</td>
                                                    <td>{account.loanType}</td>
                                                    <td>{account.accountNumber}</td>
                                                    <td>₹{Number(account.amount).toLocaleString('en-IN')}</td>
                                                    <td>{account.interestRate}%</td>
                                                    <td>{formatDate(account.startDate)}</td>
                                                    <td>{formatDate(account.endDate)}</td>
                                                    <td>₹{Number(account.emiAmount).toLocaleString('en-IN')}</td>
                                                    <td>{account.username}</td>
                                                    <td>{account.password}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Demat Accounts */}
                        {client.dematAccounts && client.dematAccounts.length > 0 && (
                            <div className="detail-section">
                                <h3>Demat Accounts</h3>
                                <div className="accounts-table-container">
                                    <table className="accounts-table">
                                        <thead>
                                            <tr>
                                                <th>Broker</th>
                                                <th>Account Number</th>
                                                <th>Username</th>
                                                <th>Password</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {client.dematAccounts.map((account, index) => (
                                                <tr key={index}>
                                                    <td>{account.brokerName}</td>
                                                    <td>{account.accountNumber}</td>
                                                    <td>{account.username}</td>
                                                    <td>{account.password}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {(!client.bankAccounts || client.bankAccounts.length === 0) && 
                        (!client.loanAccounts || client.loanAccounts.length === 0) &&
                        (!client.dematAccounts || client.dematAccounts.length === 0) && (
                            <div className="detail-section">
                                <p>No financial accounts have been added for this client.</p>
                            </div>
                        )}
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
