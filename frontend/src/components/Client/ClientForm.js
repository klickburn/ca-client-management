import React, { useState, useEffect } from 'react';
import clientService from '../../services/clientService';
import './ClientForm.css';

const initialFormState = {
    name: '',
    email: '',
    phone: '',
    address: '',
    addresses: [],
    dateOfBirth: '',
    aadharNumber: '',
    panNumber: '',
    gstNumber: '',
    tanNumber: '',
    credentials: {
        incomeTax: {
            username: '',
            password: ''
        },
        gst: {
            username: '',
            password: ''
        },
        tan: {
            username: '',
            password: ''
        },
        traces: {
            username: '',
            password: ''
        }
    },
    bankAccounts: [],
    loanAccounts: [],
    dematAccounts: [],
    clientType: 'Individual',
    services: [],
    notes: ''
};

const addressTypeOptions = [
    'Home',
    'Office',
    'Other'
];

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
    const [activeTab, setActiveTab] = useState('basic');
    const isEditMode = !!client?._id;
    
    // States for managing account entries
    const [newBankAccount, setNewBankAccount] = useState({
        bankName: '', accountNumber: '', customerId: '', password: '', 
        accountType: '', ifscCode: '', branch: ''
    });
    const [newLoanAccount, setNewLoanAccount] = useState({
        loanType: '', lenderName: '', accountNumber: '', amount: '', 
        interestRate: '', startDate: '', endDate: '', emiAmount: '', 
        username: '', password: ''
    });
    const [newDematAccount, setNewDematAccount] = useState({
        brokerName: '', accountNumber: '', username: '', password: ''
    });
    
    // State for managing address entries
    const [newAddress, setNewAddress] = useState({
        addressType: 'Home',
        streetAddress: '',
        city: '',
        state: '',
        postalCode: '',
        isPrimary: false
    });
    const [addressErrors, setAddressErrors] = useState({});

    useEffect(() => {
        if (client) {
            setFormData({
                name: client.name || '',
                email: client.email || '',
                phone: client.phone || '',
                address: client.address || '',
                addresses: client.addresses || [],
                dateOfBirth: client.dateOfBirth ? new Date(client.dateOfBirth).toISOString().split('T')[0] : '',
                aadharNumber: client.aadharNumber || '',
                panNumber: client.panNumber || '',
                gstNumber: client.gstNumber || '',
                tanNumber: client.tanNumber || '',
                credentials: {
                    incomeTax: {
                        username: client.credentials?.incomeTax?.username || '',
                        password: client.credentials?.incomeTax?.password || ''
                    },
                    gst: {
                        username: client.credentials?.gst?.username || '',
                        password: client.credentials?.gst?.password || ''
                    },
                    tan: {
                        username: client.credentials?.tan?.username || '',
                        password: client.credentials?.tan?.password || ''
                    },
                    traces: {
                        username: client.credentials?.traces?.username || '',
                        password: client.credentials?.traces?.password || ''
                    }
                },
                bankAccounts: client.bankAccounts || [],
                loanAccounts: client.loanAccounts || [],
                dematAccounts: client.dematAccounts || [],
                clientType: client.clientType || 'Individual',
                services: client.services || [],
                notes: client.notes || ''
            });
        }
    }, [client]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Handle nested credentials fields
        if (name.includes('.')) {
            const [group, subgroup, field] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [group]: {
                    ...prev[group],
                    [subgroup]: {
                        ...prev[group][subgroup],
                        [field]: value
                    }
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        
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
        
        // Validation for multiple addresses
        if (formData.addresses.length > 0) {
            // Ensure at least one address is marked as primary
            if (!formData.addresses.some(addr => addr.isPrimary)) {
                newErrors.addresses = 'One address must be marked as primary';
            }
        }
        
        if (formData.aadharNumber && !/^\d{12}$/.test(formData.aadharNumber)) {
            newErrors.aadharNumber = 'Aadhar number should be 12 digits';
        }
        
        if (formData.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber)) {
            newErrors.panNumber = 'PAN number should be in valid format (e.g., ABCDE1234F)';
        }
        
        if (formData.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/.test(formData.gstNumber)) {
            newErrors.gstNumber = 'GST number should be in valid format';
        }
        
        if (formData.tanNumber && !/^[A-Z]{4}[0-9]{5}[A-Z]{1}$/.test(formData.tanNumber)) {
            newErrors.tanNumber = 'TAN number should be in valid format (e.g., ABCD12345E)';
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

    // Handle bank account changes
    const handleBankAccountChange = (e) => {
        const { name, value } = e.target;
        setNewBankAccount(prev => ({ ...prev, [name]: value }));
    };

    // Add a bank account
    const addBankAccount = () => {
        if (newBankAccount.bankName && newBankAccount.accountNumber) {
            setFormData(prev => ({
                ...prev,
                bankAccounts: [...prev.bankAccounts, { ...newBankAccount, id: Date.now() }]
            }));
            setNewBankAccount({
                bankName: '', accountNumber: '', customerId: '', password: '', 
                accountType: '', ifscCode: '', branch: ''
            });
        }
    };

    // Remove a bank account
    const removeBankAccount = (index) => {
        setFormData(prev => ({
            ...prev,
            bankAccounts: prev.bankAccounts.filter((_, i) => i !== index)
        }));
    };

    // Handle loan account changes
    const handleLoanAccountChange = (e) => {
        const { name, value } = e.target;
        setNewLoanAccount(prev => ({ ...prev, [name]: value }));
    };

    // Add a loan account
    const addLoanAccount = () => {
        if (newLoanAccount.lenderName && newLoanAccount.accountNumber) {
            setFormData(prev => ({
                ...prev,
                loanAccounts: [...prev.loanAccounts, { ...newLoanAccount, id: Date.now() }]
            }));
            setNewLoanAccount({
                loanType: '', lenderName: '', accountNumber: '', amount: '', 
                interestRate: '', startDate: '', endDate: '', emiAmount: '', 
                username: '', password: ''
            });
        }
    };

    // Remove a loan account
    const removeLoanAccount = (index) => {
        setFormData(prev => ({
            ...prev,
            loanAccounts: prev.loanAccounts.filter((_, i) => i !== index)
        }));
    };

    // Handle demat account changes
    const handleDematAccountChange = (e) => {
        const { name, value } = e.target;
        setNewDematAccount(prev => ({ ...prev, [name]: value }));
    };

    // Add a demat account
    const addDematAccount = () => {
        if (newDematAccount.brokerName && newDematAccount.accountNumber) {
            setFormData(prev => ({
                ...prev,
                dematAccounts: [...prev.dematAccounts, { ...newDematAccount, id: Date.now() }]
            }));
            setNewDematAccount({
                brokerName: '', accountNumber: '', username: '', password: ''
            });
        }
    };

    // Remove a demat account
    const removeDematAccount = (index) => {
        setFormData(prev => ({
            ...prev,
            dematAccounts: prev.dematAccounts.filter((_, i) => i !== index)
        }));
    };

    // Address field change handler
    const handleAddressChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        setNewAddress(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        
        // Clear error when user types
        if (addressErrors[name]) {
            setAddressErrors(prev => ({ ...prev, [name]: '' }));
        }
    };
    
    // Generate a unique ID for addresses
    const generateAddressId = () => {
        return 'addr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    };
    
    // Add new address to the list
    const addAddress = () => {
        // Validate address fields
        const newErrors = {};
        if (!newAddress.streetAddress.trim()) newErrors.streetAddress = 'Street address is required';
        if (!newAddress.city.trim()) newErrors.city = 'City is required';
        if (!newAddress.state.trim()) newErrors.state = 'State is required';
        if (!newAddress.postalCode.trim()) newErrors.postalCode = 'Postal code is required';
        
        if (Object.keys(newErrors).length > 0) {
            setAddressErrors(newErrors);
            return;
        }
        
        // Create a new address with unique ID
        const addressWithId = {
            ...newAddress,
            id: generateAddressId()
        };
        
        // If this is set as primary, update all other addresses
        const updatedAddresses = [...formData.addresses];
        if (newAddress.isPrimary) {
            updatedAddresses.forEach(addr => {
                addr.isPrimary = false;
            });
        }
        
        // Add the new address
        updatedAddresses.push(addressWithId);
        
        // Update form data
        setFormData(prev => ({
            ...prev,
            addresses: updatedAddresses
        }));
        
        // Reset the new address form
        setNewAddress({
            addressType: 'Home',
            streetAddress: '',
            city: '',
            state: '',
            postalCode: '',
            isPrimary: false
        });
        
        // Clear any errors
        setAddressErrors({});
    };
    
    // Remove an address from the list
    const removeAddress = (addressId) => {
        const updatedAddresses = formData.addresses.filter(addr => addr.id !== addressId);
        
        // If we removed the primary address and there are other addresses, set the first one as primary
        const hadPrimary = formData.addresses.find(addr => addr.id === addressId)?.isPrimary;
        if (hadPrimary && updatedAddresses.length > 0) {
            updatedAddresses[0].isPrimary = true;
        }
        
        setFormData(prev => ({
            ...prev,
            addresses: updatedAddresses
        }));
    };
    
    // Set an address as primary
    const setPrimaryAddress = (addressId) => {
        const updatedAddresses = formData.addresses.map(addr => ({
            ...addr,
            isPrimary: addr.id === addressId
        }));
        
        setFormData(prev => ({
            ...prev,
            addresses: updatedAddresses
        }));
    };

    return (
        <div className="client-form-container">
            <h2>{isEditMode ? 'Edit Client' : 'Create New Client'}</h2>
            
            {submitError && (
                <div className="error-message">{submitError}</div>
            )}
            
            <div className="form-tabs">
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
                    Credentials
                </button>
                <button 
                    className={`tab-button ${activeTab === 'banking' ? 'active' : ''}`}
                    onClick={() => setActiveTab('banking')}
                >
                    Banking
                </button>
                <button 
                    className={`tab-button ${activeTab === 'other' ? 'active' : ''}`}
                    onClick={() => setActiveTab('other')}
                >
                    Other
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="client-form">
                {/* Basic Information Tab */}
                {activeTab === 'basic' && (
                    <>
                    <div className="form-tab-content">
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
                                <label htmlFor="address">Primary Address *</label>
                                <textarea
                                    id="address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className={errors.address ? 'error' : ''}
                                />
                                {errors.address && <div className="error-text">{errors.address}</div>}
                            </div>
                            
                            {/* Additional Addresses Section */}
                            <div className="form-section">
                                <h4>Additional Addresses</h4>
                                {errors.addresses && <div className="error-text">{errors.addresses}</div>}
                                
                                {formData.addresses.length > 0 && (
                                    <div className="accounts-table-container">
                                        <table className="accounts-table">
                                            <thead>
                                                <tr>
                                                    <th>Type</th>
                                                    <th>Address</th>
                                                    <th>City</th>
                                                    <th>State</th>
                                                    <th>Postal Code</th>
                                                    <th>Primary</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {formData.addresses.map((address) => (
                                                    <tr key={address.id}>
                                                        <td>{address.addressType}</td>
                                                        <td>{address.streetAddress}</td>
                                                        <td>{address.city}</td>
                                                        <td>{address.state}</td>
                                                        <td>{address.postalCode}</td>
                                                        <td>
                                                            <input 
                                                                type="checkbox" 
                                                                checked={address.isPrimary}
                                                                onChange={() => setPrimaryAddress(address.id)}
                                                                disabled={address.isPrimary}
                                                            />
                                                        </td>
                                                        <td>
                                                            <button 
                                                                type="button" 
                                                                className="delete-button"
                                                                onClick={() => removeAddress(address.id)}
                                                            >
                                                                Remove
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                
                                <div className="add-account-form">
                                    <h4>Add New Address</h4>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="addressType">Address Type</label>
                                            <select
                                                id="addressType"
                                                name="addressType"
                                                value={newAddress.addressType}
                                                onChange={handleAddressChange}
                                            >
                                                {addressTypeOptions.map(type => (
                                                    <option key={type} value={type}>{type}</option>
                                                ))}
                                            </select>
                                        </div>
                                        
                                        <div className="form-group">
                                            <label htmlFor="streetAddress">Street Address *</label>
                                            <input
                                                type="text"
                                                id="streetAddress"
                                                name="streetAddress"
                                                value={newAddress.streetAddress}
                                                onChange={handleAddressChange}
                                                className={addressErrors.streetAddress ? 'error' : ''}
                                            />
                                            {addressErrors.streetAddress && <div className="error-text">{addressErrors.streetAddress}</div>}
                                        </div>
                                    </div>
                                    
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="city">City *</label>
                                            <input
                                                type="text"
                                                id="city"
                                                name="city"
                                                value={newAddress.city}
                                                onChange={handleAddressChange}
                                                className={addressErrors.city ? 'error' : ''}
                                            />
                                            {addressErrors.city && <div className="error-text">{addressErrors.city}</div>}
                                        </div>
                                        
                                        <div className="form-group">
                                            <label htmlFor="state">State *</label>
                                            <input
                                                type="text"
                                                id="state"
                                                name="state"
                                                value={newAddress.state}
                                                onChange={handleAddressChange}
                                                className={addressErrors.state ? 'error' : ''}
                                            />
                                            {addressErrors.state && <div className="error-text">{addressErrors.state}</div>}
                                        </div>
                                        
                                        <div className="form-group">
                                            <label htmlFor="postalCode">Postal Code *</label>
                                            <input
                                                type="text"
                                                id="postalCode"
                                                name="postalCode"
                                                value={newAddress.postalCode}
                                                onChange={handleAddressChange}
                                                className={addressErrors.postalCode ? 'error' : ''}
                                            />
                                            {addressErrors.postalCode && <div className="error-text">{addressErrors.postalCode}</div>}
                                        </div>
                                    </div>
                                    
                                    <div className="form-row">
                                        <div className="form-group checkbox-group">
                                            <input
                                                type="checkbox"
                                                id="isPrimary"
                                                name="isPrimary"
                                                checked={newAddress.isPrimary}
                                                onChange={handleAddressChange}
                                            />
                                            <label htmlFor="isPrimary">Set as Primary Address</label>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        type="button" 
                                        className="add-button"
                                        onClick={addAddress}
                                    >
                                        Add Address
                                    </button>
                                </div>
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="dateOfBirth">Date of Birth</label>
                                    <input
                                        type="date"
                                        id="dateOfBirth"
                                        name="dateOfBirth"
                                        value={formData.dateOfBirth}
                                        onChange={handleChange}
                                    />
                                </div>
                                
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
                    </>
                )}
                
                {/* Identity Documents Tab */}
                {activeTab === 'identity' && (
                    <div className="form-tab-content">
                        <div className="form-section">
                            <h3>Identity Documents</h3>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="aadharNumber">Aadhar Number</label>
                                    <input
                                        type="text"
                                        id="aadharNumber"
                                        name="aadharNumber"
                                        value={formData.aadharNumber}
                                        onChange={handleChange}
                                        className={errors.aadharNumber ? 'error' : ''}
                                    />
                                    {errors.aadharNumber && <div className="error-text">{errors.aadharNumber}</div>}
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
                            </div>
                            
                            <div className="form-row">
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
                                
                                <div className="form-group">
                                    <label htmlFor="tanNumber">TAN Number</label>
                                    <input
                                        type="text"
                                        id="tanNumber"
                                        name="tanNumber"
                                        value={formData.tanNumber}
                                        onChange={handleChange}
                                        className={errors.tanNumber ? 'error' : ''}
                                    />
                                    {errors.tanNumber && <div className="error-text">{errors.tanNumber}</div>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Credentials Tab */}
                {activeTab === 'credentials' && (
                    <div className="form-tab-content">
                        <div className="form-section">
                            <h3>Government Portal Credentials</h3>
                            <p className="caution-note">Note: These credentials are stored in plain text for easy reference</p>
                            
                            <div className="credentials-section">
                                <h4>Income Tax Portal</h4>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="credentials.incomeTax.username">Username</label>
                                        <input
                                            type="text"
                                            id="credentials.incomeTax.username"
                                            name="credentials.incomeTax.username"
                                            value={formData.credentials.incomeTax.username}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="credentials.incomeTax.password">Password</label>
                                        <input
                                            type="text"
                                            id="credentials.incomeTax.password"
                                            name="credentials.incomeTax.password"
                                            value={formData.credentials.incomeTax.password}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="credentials-section">
                                <h4>GST Portal</h4>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="credentials.gst.username">Username</label>
                                        <input
                                            type="text"
                                            id="credentials.gst.username"
                                            name="credentials.gst.username"
                                            value={formData.credentials.gst.username}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="credentials.gst.password">Password</label>
                                        <input
                                            type="text"
                                            id="credentials.gst.password"
                                            name="credentials.gst.password"
                                            value={formData.credentials.gst.password}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="credentials-section">
                                <h4>TAN Portal</h4>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="credentials.tan.username">Username</label>
                                        <input
                                            type="text"
                                            id="credentials.tan.username"
                                            name="credentials.tan.username"
                                            value={formData.credentials.tan.username}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="credentials.tan.password">Password</label>
                                        <input
                                            type="text"
                                            id="credentials.tan.password"
                                            name="credentials.tan.password"
                                            value={formData.credentials.tan.password}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="credentials-section">
                                <h4>Traces Portal</h4>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="credentials.traces.username">Username</label>
                                        <input
                                            type="text"
                                            id="credentials.traces.username"
                                            name="credentials.traces.username"
                                            value={formData.credentials.traces.username}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="credentials.traces.password">Password</label>
                                        <input
                                            type="text"
                                            id="credentials.traces.password"
                                            name="credentials.traces.password"
                                            value={formData.credentials.traces.password}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Banking Tab */}
                {activeTab === 'banking' && (
                    <div className="form-tab-content">
                        <div className="form-section">
                            <h3>Bank Accounts</h3>
                            <p className="caution-note">Note: Account credentials are stored in plain text for easy reference</p>
                            
                            <div className="accounts-list">
                                {formData.bankAccounts.length > 0 ? (
                                    <div className="accounts-table-container">
                                        <table className="accounts-table">
                                            <thead>
                                                <tr>
                                                    <th>Bank Name</th>
                                                    <th>Account Number</th>
                                                    <th>IFSC</th>
                                                    <th>Customer ID</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {formData.bankAccounts.map((account, index) => (
                                                    <tr key={account.id || index}>
                                                        <td>{account.bankName}</td>
                                                        <td>{account.accountNumber}</td>
                                                        <td>{account.ifscCode}</td>
                                                        <td>{account.customerId}</td>
                                                        <td>
                                                            <button 
                                                                type="button" 
                                                                className="remove-button"
                                                                onClick={() => removeBankAccount(index)}
                                                            >
                                                                Remove
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p>No bank accounts added yet.</p>
                                )}
                            </div>
                            
                            <div className="add-account-form">
                                <h4>Add Bank Account</h4>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="bankName">Bank Name</label>
                                        <input
                                            type="text"
                                            id="bankName"
                                            name="bankName"
                                            value={newBankAccount.bankName}
                                            onChange={handleBankAccountChange}
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="accountNumber">Account Number</label>
                                        <input
                                            type="text"
                                            id="accountNumber"
                                            name="accountNumber"
                                            value={newBankAccount.accountNumber}
                                            onChange={handleBankAccountChange}
                                        />
                                    </div>
                                </div>
                                
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="accountType">Account Type</label>
                                        <input
                                            type="text"
                                            id="accountType"
                                            name="accountType"
                                            value={newBankAccount.accountType}
                                            onChange={handleBankAccountChange}
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="ifscCode">IFSC Code</label>
                                        <input
                                            type="text"
                                            id="ifscCode"
                                            name="ifscCode"
                                            value={newBankAccount.ifscCode}
                                            onChange={handleBankAccountChange}
                                        />
                                    </div>
                                </div>
                                
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="branch">Branch</label>
                                        <input
                                            type="text"
                                            id="branch"
                                            name="branch"
                                            value={newBankAccount.branch}
                                            onChange={handleBankAccountChange}
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="customerId">Customer ID</label>
                                        <input
                                            type="text"
                                            id="customerId"
                                            name="customerId"
                                            value={newBankAccount.customerId}
                                            onChange={handleBankAccountChange}
                                        />
                                    </div>
                                </div>
                                
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="password">Password</label>
                                        <input
                                            type="text"
                                            id="password"
                                            name="password"
                                            value={newBankAccount.password}
                                            onChange={handleBankAccountChange}
                                        />
                                    </div>
                                </div>
                                
                                <button 
                                    type="button" 
                                    className="add-button"
                                    onClick={addBankAccount}
                                >
                                    Add Bank Account
                                </button>
                            </div>
                            
                            <h3>Loan Accounts</h3>
                            <div className="accounts-list">
                                {formData.loanAccounts.length > 0 ? (
                                    <div className="accounts-table-container">
                                        <table className="accounts-table">
                                            <thead>
                                                <tr>
                                                    <th>Lender</th>
                                                    <th>Loan Type</th>
                                                    <th>Account Number</th>
                                                    <th>Amount</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {formData.loanAccounts.map((account, index) => (
                                                    <tr key={account.id || index}>
                                                        <td>{account.lenderName}</td>
                                                        <td>{account.loanType}</td>
                                                        <td>{account.accountNumber}</td>
                                                        <td>{account.amount}</td>
                                                        <td>
                                                            <button 
                                                                type="button" 
                                                                className="remove-button"
                                                                onClick={() => removeLoanAccount(index)}
                                                            >
                                                                Remove
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p>No loan accounts added yet.</p>
                                )}
                            </div>
                            
                            <div className="add-account-form">
                                <h4>Add Loan Account</h4>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="lenderName">Lender Name</label>
                                        <input
                                            type="text"
                                            id="lenderName"
                                            name="lenderName"
                                            value={newLoanAccount.lenderName}
                                            onChange={handleLoanAccountChange}
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="loanType">Loan Type</label>
                                        <input
                                            type="text"
                                            id="loanType"
                                            name="loanType"
                                            value={newLoanAccount.loanType}
                                            onChange={handleLoanAccountChange}
                                        />
                                    </div>
                                </div>
                                
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="accountNumber">Account Number</label>
                                        <input
                                            type="text"
                                            id="accountNumber"
                                            name="accountNumber"
                                            value={newLoanAccount.accountNumber}
                                            onChange={handleLoanAccountChange}
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="amount">Loan Amount</label>
                                        <input
                                            type="number"
                                            id="amount"
                                            name="amount"
                                            value={newLoanAccount.amount}
                                            onChange={handleLoanAccountChange}
                                        />
                                    </div>
                                </div>
                                
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="interestRate">Interest Rate (%)</label>
                                        <input
                                            type="text"
                                            id="interestRate"
                                            name="interestRate"
                                            value={newLoanAccount.interestRate}
                                            onChange={handleLoanAccountChange}
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="emiAmount">EMI Amount</label>
                                        <input
                                            type="number"
                                            id="emiAmount"
                                            name="emiAmount"
                                            value={newLoanAccount.emiAmount}
                                            onChange={handleLoanAccountChange}
                                        />
                                    </div>
                                </div>
                                
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="startDate">Start Date</label>
                                        <input
                                            type="date"
                                            id="startDate"
                                            name="startDate"
                                            value={newLoanAccount.startDate}
                                            onChange={handleLoanAccountChange}
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="endDate">End Date</label>
                                        <input
                                            type="date"
                                            id="endDate"
                                            name="endDate"
                                            value={newLoanAccount.endDate}
                                            onChange={handleLoanAccountChange}
                                        />
                                    </div>
                                </div>
                                
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="username">Username</label>
                                        <input
                                            type="text"
                                            id="username"
                                            name="username"
                                            value={newLoanAccount.username}
                                            onChange={handleLoanAccountChange}
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="password">Password</label>
                                        <input
                                            type="text"
                                            id="password"
                                            name="password"
                                            value={newLoanAccount.password}
                                            onChange={handleLoanAccountChange}
                                        />
                                    </div>
                                </div>
                                
                                <button 
                                    type="button" 
                                    className="add-button"
                                    onClick={addLoanAccount}
                                >
                                    Add Loan Account
                                </button>
                            </div>
                            
                            <h3>Demat Accounts</h3>
                            <div className="accounts-list">
                                {formData.dematAccounts.length > 0 ? (
                                    <div className="accounts-table-container">
                                        <table className="accounts-table">
                                            <thead>
                                                <tr>
                                                    <th>Broker Name</th>
                                                    <th>Account Number</th>
                                                    <th>Username</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {formData.dematAccounts.map((account, index) => (
                                                    <tr key={account.id || index}>
                                                        <td>{account.brokerName}</td>
                                                        <td>{account.accountNumber}</td>
                                                        <td>{account.username}</td>
                                                        <td>
                                                            <button 
                                                                type="button" 
                                                                className="remove-button"
                                                                onClick={() => removeDematAccount(index)}
                                                            >
                                                                Remove
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p>No demat accounts added yet.</p>
                                )}
                            </div>
                            
                            <div className="add-account-form">
                                <h4>Add Demat Account</h4>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="brokerName">Broker Name</label>
                                        <input
                                            type="text"
                                            id="brokerName"
                                            name="brokerName"
                                            value={newDematAccount.brokerName}
                                            onChange={handleDematAccountChange}
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="accountNumber">Account Number</label>
                                        <input
                                            type="text"
                                            id="accountNumber"
                                            name="accountNumber"
                                            value={newDematAccount.accountNumber}
                                            onChange={handleDematAccountChange}
                                        />
                                    </div>
                                </div>
                                
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="username">Username</label>
                                        <input
                                            type="text"
                                            id="username"
                                            name="username"
                                            value={newDematAccount.username}
                                            onChange={handleDematAccountChange}
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="password">Password</label>
                                        <input
                                            type="text"
                                            id="password"
                                            name="password"
                                            value={newDematAccount.password}
                                            onChange={handleDematAccountChange}
                                        />
                                    </div>
                                </div>
                                
                                <button 
                                    type="button" 
                                    className="add-button"
                                    onClick={addDematAccount}
                                >
                                    Add Demat Account
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Other Information Tab */}
                {activeTab === 'other' && (
                    <div className="form-tab-content">
                        <div className="form-section">
                            <h3>Additional Information</h3>
                            <div className="form-group">
                                <label htmlFor="notes">Notes</label>
                                <textarea
                                    id="notes"
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    rows="8"
                                />
                            </div>
                        </div>
                    </div>
                )}
                
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
