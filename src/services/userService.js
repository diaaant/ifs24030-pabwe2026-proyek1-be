const bcrypt = require('bcryptjs');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const { buildMeta } = require('../utils/response');
const { toPaging } = require('../utils/pagination');
const userRepository = require('../repositories/userRepository');

const updateProfile = (userId, data) => userRepository.updateProfile(userId, data);

const changePassword = async (userId, { current_password: currentPassword, new_password: newPassword }) => {
  const credentials = userRepository.findCredentialsById(userId);
  const matches = await bcrypt.compare(currentPassword, credentials.password_hash);
  if (!matches) {
    throw new AppError(422, 'Kata sandi lama tidak sesuai', [
      { field: 'current_password', message: 'Kata sandi lama tidak sesuai' },
    ]);
  }
  const passwordHash = await bcrypt.hash(newPassword, env.bcryptRounds);
  userRepository.updatePassword(userId, passwordHash);
};

const list = ({ search, ...paging }) => {
  const { page, limit, offset } = toPaging(paging);
  return {
    items: userRepository.list({ search, limit, offset }),
    meta: buildMeta(page, limit, userRepository.count(search)),
  };
};

module.exports = { updateProfile, changePassword, list };
