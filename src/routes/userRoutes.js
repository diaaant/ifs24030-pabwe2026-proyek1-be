const { Router } = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const controller = require('../controllers/userController');
const authSchema = require('../validators/authValidator');
const userSchema = require('../validators/userValidator');
const { ROLES } = require('../config/constants');

const router = Router();
router.use(authenticate);

router.get('/me', controller.me);
router.put('/me', validate({ body: authSchema.updateProfile }), controller.updateMe);
router.put('/me/password', validate({ body: authSchema.changePassword }), controller.changePassword);
router.get('/', authorize(ROLES.ADMIN), validate({ query: userSchema.list }), controller.list);

module.exports = router;
