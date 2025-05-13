const Client = require('../models/Client');

// Create a new client
exports.createClient = async (req, res) => {
    try {
        const clientData = {
            ...req.body,
            createdBy: req.user.id // Add the current user's ID
        };
        const client = new Client(clientData);
        await client.save();
        res.status(201).json(client);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all clients
exports.getClients = async (req, res) => {
    try {
        const clients = await Client.find();
        res.status(200).json(clients);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a client by ID
exports.getClientById = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }
        res.status(200).json(client);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a client by ID
exports.updateClient = async (req, res) => {
    try {
        const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }
        res.status(200).json(client);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a client by ID
exports.deleteClient = async (req, res) => {
    try {
        const client = await Client.findByIdAndDelete(req.params.id);
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};