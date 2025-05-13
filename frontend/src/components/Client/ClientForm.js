import React, { useState, useEffect } from 'react';
import clientService from '../../services/clientService';
import './ClientForm.css';

const initialFormState = {
    name: '',
    email: '',
    phone: '',
    address: '',
    panNumber: '',
    gstNumber: '',
    clientType: 'Individual',
    services: [],
    notes: ''
};

const serviceOptions = [
    'Income Tax Filing',
    'GST Filing',
    'Accounting',
    'Audit',
    'Company Formation',
    'Consultancy',
    'Other'
];

const clientTypeOptions = [
    'Individual',
    'Partnership',
    'LLP',
    'Pvt Ltd',
    'Public Ltd',
    'HUF',
    'Other'
];

const ClientForm = ({ client, onSave, onCancel }) => {
    const [formData, setFormData] = useState(initialFormState);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const isEditMode = !!client?._id;

    useEffect(() => {
        if (client) {
            setFormData({
                name: client.name || '',
                email: client.email || '',
                phone: client.phone || '',
                address: client.address || '',
                panNumber: client.panNumber || '',
                gstNumber: client.gstNumber || '',
                clientType: client.clientType || 'Individual',
                services: client.services || [],
                notes: client.notes || ''
            });
        }
    }, [client]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Clear error when field is updated
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleServiceChange = (service) => {
        setFormData(prev => {
            const services = prev.services.includes(service)
                ? prev.services.filter(s => s !== service)
                : [...prev.services, service];
            return { ...prev, services };
        });
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }
        
        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone number is required';
        } else if (!/^[0-9+\s()-]{10,15}$/.test(formData.phone.replace(/\s/g, ''))) {
            newErrors.phone = 'Phone number is invalid';
        }
        
        if (!formData.address.trim()) newErrors.address = 'Address is required';
        
        if (formData.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber)) {
            newErrors.panNumber = 'PAN number should be in valid format (e.g., ABCDE1234F)';
        }
        
        if (formData.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/.test(formData.gstNumber)) {
            newErrors.gstNumber = 'GST number should be in valid format (e.g., 22AAAAA0000A1Z5)';
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
            let savedClient;
            
            if (isEditMode) {
                savedClient = await clientService.updateClient(client._id, formData);
            } else {
                savedClient = await clientService.createClient(formData);
            }
            
            onSave(savedClient);
        } catch (error) {
            console.error('Error saving client:', error);
            setSubmitError(
                error.response?.data?.message || 
                'Error saving client. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="client-form-container">
            <h2>{isEditMode ? 'Edit Client' : 'Create New Client'}</h2>
            
            {submitError && (
                <div className="error-message">{submitError}</div>
            )}
            
            <form onSubmit={handleSubmit} className="client-form">
                <div className="form-section">
                    <h3>Basic Information</h3>
                    
                    <div className="form-group">
                        <label htmlFor="name">Client Name *</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={errors.name ? 'error' : ''}
                        />
                        {errors.name && <div className="error-text">{errors.name}</div>}
                    </div>
                    
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="email">Email *</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={errors.email ? 'error' : ''}
                            />
                            {errors.email && <div className="error-text">{errors.email}</div>}
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="phone">Phone *</label>
                            <input
                                type="text"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className={errors.phone ? 'error' : ''}
                            />
                            {errors.phone && <div className="error-text">{errors.phone}</div>}
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="address">Address *</label>
                        <textarea
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className={errors.address ? 'error' : ''}
                        />
                        {errors.address && <div className="error-text">{errors.address}</div>}
                    </div>
                </div>
                
                <div className="form-section">
                    <h3>Business Information</h3>
                    
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="clientType">Client Type</label>
                            <select
                                id="clientType"
                                name="clientType"
                                value={formData.clientType}
                                onChange={handleChange}
                            >
                                {clientTypeOptions.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="panNumber">PAN Number</label>
                            <input
                                type="text"
                                id="panNumber"
                                name="panNumber"
                                value={formData.panNumber}
                                onChange={handleChange}
                                className={errors.panNumber ? 'error' : ''}
                            />
                            {errors.panNumber && <div className="error-text">{errors.panNumber}</div>}
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="gstNumber">GST Number</label>
                            <input
                                type="text"
                                id="gstNumber"
                                name="gstNumber"
                                value={formData.gstNumber}
                                onChange={handleChange}
                                className={errors.gstNumber ? 'error' : ''}
                            />
                            {errors.gstNumber && <div className="error-text">{errors.gstNumber}</div>}
                        </div>
                    </div>
                </div>
                
                <div className="form-section">
                    <h3>Services</h3>
                    <div className="services-checkboxes">
                        {serviceOptions.map(service => (
                            <div key={service} className="checkbox-group">
                                <input
                                    type="checkbox"
                                    id={`service-${service}`}
                                    checked={formData.services.includes(service)}
                                    onChange={() => handleServiceChange(service)}
                                />
                                <label htmlFor={`service-${service}`}>{service}</label>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="form-section">
                    <h3>Additional Information</h3>
                    <div className="form-group">
                        <label htmlFor="notes">Notes</label>
                        <textarea
                            id="notes"
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows="4"
                        />
                    </div>
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
                        {loading ? 'Saving...' : isEditMode ? 'Update Client' : 'Create Client'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ClientForm;
