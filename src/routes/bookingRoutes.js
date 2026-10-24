const { Router } = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const controller = require('../controllers/bookingController');
const schema = require('../validators/bookingValidator');
const { idParam } = require('../validators/common');
const { ROLES } = require('../config/constants');

const router = Router();
router.use(authenticate);

// Rute statis harus berada sebelum '/:id'.
router.get('/availability', validate({ query: schema.availability }), controller.availability);

router.get('/', validate({ query: schema.list }), controller.list);
router.post('/', validate({ body: schema.create }), controller.create);
router.get('/:id', validate({ params: idParam }), controller.get);
router.patch('/:id/cancel', validate({ params: idParam }), controller.cancel);

router.patch(
  '/:id/status',
  authorize(ROLES.ADMIN),
  validate({ params: idParam, body: schema.updateStatus }),
  controller.updateStatus,
);
router.post(
  '/:id/complete',
  authorize(ROLES.ADMIN),
  validate({ params: idParam, body: schema.complete }),
  controller.complete,
);

module.exports = router;
