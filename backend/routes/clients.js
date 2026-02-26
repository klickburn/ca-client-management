const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const authMiddleware = require('../middleware/auth');
const { checkPermission, filterClientAccess } = require('../middleware/permissions');

// Create a new client (partner, seniorCA only)
router.post('/', authMiddleware, checkPermission('client:create'), clientController.createClient);

// Get all clients (filtered by role)
router.get('/', authMiddleware, filterClientAccess, clientController.getClients);

// Get a specific client by ID (access checked in controller)
router.get('/:id', authMiddleware, filterClientAccess, clientController.getClientById);

// Update a client (partner, seniorCA only)
router.put('/:id', authMiddleware, checkPermission('client:edit'), clientController.updateClient);

// Delete a client (partner only)
router.delete('/:id', authMiddleware, checkPermission('client:delete'), clientController.deleteClient);

module.exports = router;
