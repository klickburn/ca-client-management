const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');
const { getDashboardStats } = require('../controllers/reportController');

router.use(authMiddleware);

router.get('/dashboard', checkPermission('dashboard:full'), getDashboardStats);

module.exports = router;
