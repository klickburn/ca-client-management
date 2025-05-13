const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Route to create a new user (admin only)
router.post('/create', authMiddleware, roleCheck(['admin']), userController.createUser);

// Route to list all users (admin only)
router.get('/', authMiddleware, roleCheck(['admin']), userController.getAllUsers);

// Route to assign role to user (admin only)
router.put('/role', authMiddleware, roleCheck(['admin']), userController.assignRole);

// Route to delete a user (admin only)
router.delete('/:id', authMiddleware, roleCheck(['admin']), userController.deleteUser);

// Route to get user password (admin only)
router.get('/password/:id', authMiddleware, roleCheck(['admin']), userController.getUserPassword);

module.exports = router;