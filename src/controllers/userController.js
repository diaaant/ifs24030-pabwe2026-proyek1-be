const { success } = require('../utils/response');
const userService = require('../services/userService');

const me = (req, res) => success(res, { data: req.user });

const updateMe = (req, res) =>
  success(res, { message: 'Profil berhasil diperbarui', data: userService.updateProfile(req.user.id, req.valid.body) });

const changePassword = async (req, res) => {
  await userService.changePassword(req.user.id, req.valid.body);
  return success(res, { message: 'Kata sandi berhasil diubah' });
};

const list = (req, res) => {
  const { items, meta } = userService.list(req.valid.query);
  return success(res, { data: items, meta });
};

module.exports = { me, updateMe, changePassword, list };
