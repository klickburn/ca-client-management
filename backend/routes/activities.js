const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');
const { getActivities } = require('../controllers/activityController');

router.use(authMiddleware);

router.get('/', checkPermission('activity:view'), getActivities);

module.exports = router;
