const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getNotifications, getUnreadCount, markAsRead, markAllRead } = require('../controllers/notificationController');

router.use(authMiddleware);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/read-all', markAllRead);
router.put('/:id/read', markAsRead);

module.exports = router;
