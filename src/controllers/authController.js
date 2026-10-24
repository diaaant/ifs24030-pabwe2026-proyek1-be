const { success } = require('../utils/response');
const authService = require('../services/authService');

const register = async (req, res) => {
  const data = await authService.register(req.valid.body);
  return success(res, { status: 201, message: 'Registrasi berhasil', data });
};

const login = async (req, res) => {
  const data = await authService.login(req.valid.body);
  return success(res, { message: 'Login berhasil', data });
};

module.exports = { register, login };
