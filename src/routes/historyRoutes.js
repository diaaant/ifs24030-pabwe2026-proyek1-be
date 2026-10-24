const { Router } = require('express');
const { authenticate } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const controller = require('../controllers/historyController');
const schema = require('../validators/historyValidator');
const { idParam } = require('../validators/common');

const router = Router();
router.use(authenticate);

router.get('/', validate({ query: schema.list }), controller.list);
router.get('/:id', validate({ params: idParam }), controller.get);

module.exports = router;
