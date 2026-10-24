const { Router } = require('express');
const validate = require('../middlewares/validate');
const controller = require('../controllers/authController');
const schema = require('../validators/authValidator');

const router = Router();

router.post('/register', validate({ body: schema.register }), controller.register);
router.post('/login', validate({ body: schema.login }), controller.login);

module.exports = router;
