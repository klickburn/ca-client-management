const Client = require('../models/Client');
const User = require('../models/User');
const Task = require('../models/Task');
const Invoice = require('../models/Invoice');
const Filing = require('../models/Filing');
const DocRequest = require('../models/DocRequest');
const Message = require('../models/Message');
const DSC = require('../models/DSC');
const Notification = require('../models/Notification');
const bcrypt = require('bcryptjs');
const ActivityLog = require('../models/ActivityLog');
const crypto = require('crypto');

const logActivity = async (action, userId, targetId, details) => {
    try {
        await ActivityLog.create({ action, performedBy: userId, targetType: 'Client', targetId, details });
    } catch (err) { console.error('Activity log error:', err.message); }
};

/**
 * Generate a unique username from client's phone number.
 * Format: phone number (digits only). Falls back to name-based if phone not unique.
 */
const generateUsername = async (client) => {
    // Try phone number first (most natural for Indian clients)
    const phone = client.phone?.replace(/\D/g, '');
    if (phone) {
        const exists = await User.findOne({ username: phone });
        if (!exists) return phone;
    }

    // Fallback: lowercase name with no spaces + random 4 digits
    const baseName = client.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    let username = baseName;
    let attempts = 0;
    while (attempts < 10) {
        const exists = await User.findOne({ username });
        if (!exists) return username;
        username = baseName + crypto.randomInt(1000, 9999);
        attempts++;
    }
    // Last resort: random string
    return baseName + crypto.randomBytes(4).toString('hex');
};

/**
 * Generate a random password (8 chars: letters + digits).
 */
const generatePassword = () => {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghjkmnpqrstuvwxyz';
    const digits = '23456789';
    const special = '@#$%&*!';
    const all = upper + lower + digits + special;
    // Ensure at least one of each type
    let password = '';
    password += upper.charAt(crypto.randomInt(upper.length));
    password += lower.charAt(crypto.randomInt(lower.length));
    password += digits.charAt(crypto.randomInt(digits.length));
    password += special.charAt(crypto.randomInt(special.length));
    for (let i = 4; i < 12; i++) {
        password += all.charAt(crypto.randomInt(all.length));
    }
    // Shuffle
    return password.split('').sort(() => crypto.randomInt(3) - 1).join('');
};

// Create a new client
exports.createClient = async (req, res) => {
    try {
        const clientData = {
            ...req.body,
            createdBy: req.user.id
        };
        const client = new Client(clientData);
        await client.save();

        // Auto-create a portal user account for this client
        let portalCredentials = null;
        try {
            const username = await generateUsername(client);
            const plainPassword = generatePassword();
            const hashedPassword = await bcrypt.hash(plainPassword, 10);

            const clientUser = new User({
                username,
                password: hashedPassword,
                role: 'client',
                clientId: client._id,
                createdBy: req.user.id,
            });
            await clientUser.save();
            portalCredentials = { username, password: plainPassword };
        } catch (err) {
            console.error('Error creating client portal account:', err.message);
            // Don't fail client creation if user creation fails
        }

        await logActivity('client:create', req.user.id, client._id, `Created client: ${client.name}`);
        res.status(201).json({ ...client.toObject(), portalCredentials });
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
        res.status(500).json({ message: 'Server error' });
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
        res.status(500).json({ message: 'Server error' });
    }
};

// Update a client by ID — whitelist allowed fields to prevent mass assignment
const ALLOWED_CLIENT_FIELDS = [
    'name', 'email', 'phone', 'clientType', 'aadharNumber', 'panNumber',
    'gstNumber', 'tanNumber', 'services', 'notes', 'addresses',
    'credentials', 'bankAccounts', 'loanAccounts', 'dematAccounts',
];

exports.updateClient = async (req, res) => {
    try {
        const updateData = {};
        for (const key of ALLOWED_CLIENT_FIELDS) {
            if (req.body[key] !== undefined) updateData[key] = req.body[key];
        }
        const client = await Client.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }
        await logActivity('client:update', req.user.id, client._id, `Updated client: ${client.name}`);
        res.status(200).json(client);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get portal credentials for a client (username only, password is hashed)
exports.getPortalCredentials = async (req, res) => {
    try {
        const clientUser = await User.findOne({ clientId: req.params.id, role: 'client' }).select('username');
        if (!clientUser) {
            return res.json({ hasAccount: false });
        }
        res.json({ hasAccount: true, username: clientUser.username });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Reset portal password for a client
exports.resetPortalPassword = async (req, res) => {
    try {
        const clientUser = await User.findOne({ clientId: req.params.id, role: 'client' });
        if (!clientUser) {
            return res.status(404).json({ message: 'No portal account found for this client' });
        }
        const newPassword = generatePassword();
        clientUser.password = await bcrypt.hash(newPassword, 10);
        await clientUser.save();
        await logActivity('client:update', req.user.id, req.params.id, `Reset portal password for client`);
        res.json({ username: clientUser.username, password: newPassword });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete a client by ID
exports.deleteClient = async (req, res) => {
    try {
        const client = await Client.findByIdAndDelete(req.params.id);
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }
        // Cascade delete all related data
        await Promise.all([
            User.deleteMany({ clientId: client._id, role: 'client' }),
            Task.deleteMany({ client: client._id }),
            Invoice.deleteMany({ client: client._id }),
            Filing.deleteMany({ client: client._id }),
            DocRequest.deleteMany({ client: client._id }),
            Message.deleteMany({ client: client._id }),
            DSC.deleteMany({ client: client._id }),
        ]);
        await logActivity('client:delete', req.user.id, client._id, `Deleted client: ${client.name}`);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
