const Client = require('../models/Client');

// Create a new client
exports.createClient = async (req, res) => {
    try {
        const clientData = {
            ...req.body,
            createdBy: req.user.id
        };
        const client = new Client(clientData);
        await client.save();
        res.status(201).json(client);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all clients (filtered by role via filterClientAccess middleware)
exports.getClients = async (req, res) => {
    try {
        const clients = await Client.find(req.clientFilter || {});
        res.status(200).json(clients);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a client by ID (with role-based access check)
exports.getClientById = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        // Verify user has access to this specific client
        if (req.clientFilter && req.clientFilter._id) {
            const allowedIds = req.clientFilter._id.$in || [req.clientFilter._id];
            const hasAccess = allowedIds.some(id => id.toString() === client._id.toString());
            if (!hasAccess) {
                return res.status(403).json({ message: 'Access denied to this client' });
            }
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
