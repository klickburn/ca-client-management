const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/auth');
const { filterClientAccess } = require('../middleware/permissions');

// Get messages for a client thread
router.get('/:clientId', authMiddleware, filterClientAccess, messageController.getMessages);

// Send a message
router.post('/:clientId', authMiddleware, filterClientAccess, messageController.sendMessage);

// Get unread count
router.get('/:clientId/unread', authMiddleware, filterClientAccess, messageController.getUnreadCount);

// Mark all read
router.put('/:clientId/read', authMiddleware, filterClientAccess, messageController.markRead);

module.exports = router;
