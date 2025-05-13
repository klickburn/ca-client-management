const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Route to create a new client (both admin and regular users)
router.post('/', authMiddleware, clientController.createClient);

// Route to get all clients
router.get('/', authMiddleware, clientController.getClients);

// Route to get a specific client by ID
router.get('/:id', authMiddleware, clientController.getClientById);

// Route to update a client by ID
router.put('/:id', authMiddleware, clientController.updateClient);

// Route to delete a client by ID (admin only)
router.delete('/:id', authMiddleware, roleCheck(['admin']), clientController.deleteClient);

module.exports = router;