const { Router } = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const controller = require('../controllers/serviceController');
const schema = require('../validators/serviceValidator');
const { idParam } = require('../validators/common');
const { ROLES } = require('../config/constants');

const router = Router();
router.use(authenticate);

router.get('/', validate({ query: schema.list }), controller.list);
router.get('/:id', validate({ params: idParam }), controller.get);

router.post('/', authorize(ROLES.ADMIN), validate({ body: schema.body }), controller.create);
router.put('/:id', authorize(ROLES.ADMIN), validate({ params: idParam, body: schema.body }), controller.update);
router.delete('/:id', authorize(ROLES.ADMIN), validate({ params: idParam }), controller.remove);

module.exports = router;
