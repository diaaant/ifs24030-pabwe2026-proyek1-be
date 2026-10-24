const AppError = require('../utils/AppError');
const serviceRepository = require('../repositories/serviceRepository');

const NOT_FOUND = 'Layanan tidak ditemukan';

const present = (row) => ({ ...row, is_active: Boolean(row.is_active) });

const assertNameAvailable = (name, ignoreId) => {
  const existing = serviceRepository.findByName(name);
  if (existing && existing.id !== ignoreId) {
    throw new AppError(409, 'Nama layanan sudah digunakan', [{ field: 'name', message: 'Nama layanan sudah digunakan' }]);
  }
};

const list = ({ vehicle_type: vehicleType, include_inactive: includeInactive }, user) => {
  // Hanya admin yang boleh melihat layanan nonaktif.
  const withInactive = includeInactive === 'true' && user.role === 'admin';
  return serviceRepository.list({ vehicleType, includeInactive: withInactive }).map(present);
};

const get = (id) => {
  const service = serviceRepository.findById(id);
  if (!service) throw new AppError(404, NOT_FOUND);
  return present(service);
};

const create = (data) => {
  assertNameAvailable(data.name);
  return present(serviceRepository.create(data));
};

const update = (id, data) => {
  get(id);
  assertNameAvailable(data.name, id);
  return present(serviceRepository.update(id, data));
};

/** Layanan yang pernah dibooking hanya dinonaktifkan agar riwayat tetap utuh. */
const remove = (id) => {
  get(id);
  if (serviceRepository.countBookings(id) > 0) {
    serviceRepository.deactivate(id);
    return { deactivated: true };
  }
  serviceRepository.remove(id);
  return { deactivated: false };
};

module.exports = { list, get, create, update, remove };
