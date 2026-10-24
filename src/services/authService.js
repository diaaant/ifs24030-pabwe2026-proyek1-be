const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { ROLES } = require('../config/constants');
const AppError = require('../utils/AppError');
const userRepository = require('../repositories/userRepository');

const signToken = (user) =>
  jwt.sign({ sub: String(user.id), role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

const register = async ({ name, email, phone, password }) => {
  if (userRepository.findByEmail(email)) {
    throw new AppError(409, 'Email sudah terdaftar', [{ field: 'email', message: 'Email sudah digunakan' }]);
  }

  const passwordHash = await bcrypt.hash(password, env.bcryptRounds);
  const user = userRepository.create({ name, email, phone, passwordHash, role: ROLES.CUSTOMER });
  return { user, token: signToken(user) };
};

const login = async ({ email, password }) => {
  const credentials = userRepository.findCredentialsByEmail(email);
  const valid = credentials ? await bcrypt.compare(password, credentials.password_hash) : false;
  if (!valid) throw new AppError(401, 'Email atau kata sandi salah');

  const user = userRepository.findById(credentials.id);
  return { user, token: signToken(user) };
};

module.exports = { register, login, signToken };
