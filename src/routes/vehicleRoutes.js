const { Router } = require('express');
const { authenticate } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const controller = require('../controllers/vehicleController');
const schema = require('../validators/vehicleValidator');
const { idParam } = require('../validators/common');

const router = Router();
router.use(authenticate);

router.get('/', validate({ query: schema.list }), controller.list);
router.post('/', validate({ body: schema.body }), controller.create);
router.get('/:id', validate({ params: idParam }), controller.get);
router.put('/:id', validate({ params: idParam, body: schema.body }), controller.update);
router.delete('/:id', validate({ params: idParam }), controller.remove);
router.get('/:id/history', validate({ params: idParam }), controller.history);

module.exports = router;
