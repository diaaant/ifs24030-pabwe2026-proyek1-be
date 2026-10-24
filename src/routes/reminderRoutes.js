const { Router } = require('express');
const { authenticate } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const controller = require('../controllers/historyController');
const schema = require('../validators/historyValidator');

const router = Router();
router.use(authenticate);

router.get('/', validate({ query: schema.reminders }), controller.reminders);

module.exports = router;
