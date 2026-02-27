const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');
const { createTask, getTasks, updateTask, deleteTask, getTaskStats } = require('../controllers/taskController');

router.use(authMiddleware);

router.get('/stats', getTaskStats);
router.get('/', getTasks);
router.post('/', checkPermission('task:create'), createTask);
router.put('/:id', updateTask);
router.delete('/:id', checkPermission('task:delete'), deleteTask);

module.exports = router;
