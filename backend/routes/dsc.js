const router = require('express').Router();
const authMiddleware = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');
const dscController = require('../controllers/dscController');

router.use(authMiddleware);

router.get('/stats', dscController.getDSCStats);
router.get('/', dscController.getDSCs);
router.post('/', checkPermission('client:edit'), dscController.createDSC);
router.put('/:id', checkPermission('client:edit'), dscController.updateDSC);
router.delete('/:id', checkPermission('client:delete'), dscController.deleteDSC);

module.exports = router;
