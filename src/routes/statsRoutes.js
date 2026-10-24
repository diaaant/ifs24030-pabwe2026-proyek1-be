const { Router } = require('express');
const { authenticate } = require('../middlewares/auth');
const controller = require('../controllers/statsController');

const router = Router();
router.use(authenticate);

router.get('/dashboard', controller.dashboard);

module.exports = router;
