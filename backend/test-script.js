// This is a test script to verify CA Client Management System functionality
// Run with: node test-script.js

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5001/api';
let authToken = '';
let userId = '';
let testClientId = '';
let testDocumentId = '';

const runTests = async () => {
    try {
        console.log('🔍 Starting CA Client Management System Tests...');
        
        // 1. Login with admin credentials
        await testLogin();
        
        // 2. Test user operations
        await testUserOperations();
        
        // 3. Test client operations
        await testClientOperations();
        
        // 4. Test document operations
        await testDocumentOperations();
        
        console.log('✅ All tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
};

const testLogin = async () => {
    console.log('\n🔑 Testing Authentication...');
    
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
        username: 'KlickBurn',
        password: 'ilovekomal'
    });
    
    console.log('✅ Admin login successful');
    authToken = loginRes.data.token;
    userId = loginRes.data.userId;
    
    // Set default auth header for all subsequent requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
};

const testUserOperations = async () => {
    console.log('\n👤 Testing User Operations...');
    
    // Create a test user
    const newUser = {
        username: `testuser_${Date.now()}`,
        password: 'password123',
        role: 'user'
    };
    
    const createUserRes = await axios.post(`${API_URL}/users/create`, newUser);
    console.log(`✅ Created test user: ${createUserRes.data.username}`);
    
    // Get all users
    const usersRes = await axios.get(`${API_URL}/users`);
    console.log(`✅ Retrieved ${usersRes.data.length} users`);
};

const testClientOperations = async () => {
    console.log('\n🏢 Testing Client Operations...');
    
    // Create a test client
    const newClient = {
        name: `Test Client ${Date.now()}`,
        email: `testclient${Date.now()}@example.com`,
        phone: '9876543210',
        address: 'Test Address, Mumbai, Maharashtra',
        panNumber: `ABCTY${Math.floor(1000 + Math.random() * 9000)}Z`,
        gstNumber: `27ABCTY${Math.floor(1000 + Math.random() * 9000)}Z1ZY`,
        clientType: 'Individual',
        services: ['Income Tax Filing', 'GST Filing'],
        notes: 'This is a test client created for testing purposes.'
    };
    
    const createClientRes = await axios.post(`${API_URL}/clients`, newClient);
    testClientId = createClientRes.data._id;
    console.log(`✅ Created test client: ${createClientRes.data.name}`);
    
    // Get client details
    const clientRes = await axios.get(`${API_URL}/clients/${testClientId}`);
    console.log(`✅ Retrieved client details: ${clientRes.data.name}`);
    
    // Update client
    const updateRes = await axios.put(`${API_URL}/clients/${testClientId}`, {
        ...newClient,
        name: `${newClient.name} (Updated)`
    });
    console.log(`✅ Updated client: ${updateRes.data.name}`);
    
    // Get all clients
    const clientsRes = await axios.get(`${API_URL}/clients`);
    console.log(`✅ Retrieved ${clientsRes.data.length} clients`);
};

const testDocumentOperations = async () => {
    console.log('\n📄 Testing Document Operations...');
    
    // Create a test document file (PDF-like)
    const testFilePath = path.join(__dirname, 'test-document.pdf');
    fs.writeFileSync(testFilePath, '%PDF-1.5\nThis is a test PDF document for the CA Client Management System.');
    
    // Upload document
    const formData = new FormData();
    formData.append('document', fs.createReadStream(testFilePath), {
        filename: 'test-document.pdf',
        contentType: 'application/pdf'
    });
    
    const uploadRes = await axios.post(
        `${API_URL}/clients/${testClientId}/documents`, 
        formData, 
        { headers: { ...formData.getHeaders() } }
    );
    
    testDocumentId = uploadRes.data._id;
    console.log(`✅ Uploaded test document: ${uploadRes.data.name}`);
    
    // Get all documents
    const docsRes = await axios.get(`${API_URL}/clients/${testClientId}/documents`);
    console.log(`✅ Retrieved ${docsRes.data.length} documents`);
    
    // Get the document ID properly
    testDocumentId = docsRes.data[0]._id;
    console.log(`Document ID for deletion: ${testDocumentId}`);
    
    // Delete test document
    await axios.delete(`${API_URL}/clients/${testClientId}/documents/${testDocumentId}`);
    console.log(`✅ Deleted test document`);
    
    // Cleanup
    fs.unlinkSync(testFilePath);
};

runTests();
