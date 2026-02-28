const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const { checkPermission, checkCreationHierarchy } = require('../middleware/permissions');

// Create a new user (partner, seniorCA — with hierarchy enforcement)
router.post('/create', authMiddleware, checkPermission('user:create'), checkCreationHierarchy, userController.createUser);

// List all users (partner for team management)
router.get('/', authMiddleware, checkPermission('team:manage'), userController.getAllUsers);

// Assign role to user (partner only)
router.put('/role', authMiddleware, checkPermission('team:manage'), userController.assignRole);

// Change own password (any authenticated user)
router.put('/change-password', authMiddleware, userController.changePassword);

// Delete a user (partner only)
router.delete('/:id', authMiddleware, checkPermission('user:delete'), userController.deleteUser);

module.exports = router;
