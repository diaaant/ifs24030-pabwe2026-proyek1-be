const AppError = require('../utils/AppError');
const { assertOwnerOrAdmin, isAdmin } = require('../utils/access');
const { buildMeta } = require('../utils/response');
const { toPaging } = require('../utils/pagination');
const vehicleRepository = require('../repositories/vehicleRepository');
const historyRepository = require('../repositories/historyRepository');
const { withInvoice } = require('./historyService');

const NOT_FOUND = 'Kendaraan tidak ditemukan';

const findAccessible = (user, id) => {
  const vehicle = vehicleRepository.findById(id);
  if (!vehicle) throw new AppError(404, NOT_FOUND);
  assertOwnerOrAdmin(user, vehicle.user_id, NOT_FOUND);
  return vehicle;
};

const assertPlateAvailable = (plateNumber, ignoreId) => {
  const existing = vehicleRepository.findByPlate(plateNumber);
  if (existing && existing.id !== ignoreId) {
    throw new AppError(409, 'Nomor polisi sudah terdaftar', [
      { field: 'plate_number', message: 'Nomor polisi sudah terdaftar' },
    ]);
  }
};

const list = (user, { search, vehicle_type: vehicleType, ...paging }) => {
  const { page, limit, offset } = toPaging(paging);
  const filter = { userId: isAdmin(user) ? null : user.id, search, vehicleType };
  return {
    items: vehicleRepository.list({ ...filter, limit, offset }),
    meta: buildMeta(page, limit, vehicleRepository.count(filter)),
  };
};

const get = (user, id) => findAccessible(user, id);

const create = (user, data) => {
  assertPlateAvailable(data.plate_number);
  return vehicleRepository.create(user.id, data);
};

const update = (user, id, data) => {
  findAccessible(user, id);
  assertPlateAvailable(data.plate_number, id);
  return vehicleRepository.update(id, data);
};

const remove = (user, id) => {
  findAccessible(user, id);
  if (vehicleRepository.countBookings(id) > 0) {
    throw new AppError(409, 'Kendaraan memiliki riwayat booking sehingga tidak dapat dihapus');
  }
  vehicleRepository.remove(id);
};

const history = (user, id) => {
  findAccessible(user, id);
  return historyRepository.listByVehicle(id).map(withInvoice);
};

module.exports = { list, get, create, update, remove, history };
