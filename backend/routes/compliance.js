const router = require('express').Router();
const authMiddleware = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');
const complianceController = require('../controllers/complianceController');

router.use(authMiddleware);

// Compliance calendar
router.get('/calendar', complianceController.getCalendar);

// Auto-generate tasks from deadlines (partner/seniorCA only)
router.post('/generate-tasks', checkPermission('task:create'), complianceController.generateTasks);

// Send deadline alerts (partner/seniorCA only)
router.post('/send-alerts', checkPermission('dashboard:full'), complianceController.sendDeadlineAlerts);

// Document checklists
router.get('/checklists', complianceController.getChecklists);
router.get('/checklist', complianceController.getDocumentChecklist);

// Validation
router.get('/validate-pan', complianceController.validatePAN);
router.get('/validate-gstin', complianceController.validateGSTIN);

module.exports = router;
