const { success } = require('../utils/response');
const vehicleService = require('../services/vehicleService');

const list = (req, res) => {
  const { items, meta } = vehicleService.list(req.user, req.valid.query);
  return success(res, { data: items, meta });
};

const get = (req, res) => success(res, { data: vehicleService.get(req.user, req.valid.params.id) });

const create = (req, res) =>
  success(res, { status: 201, message: 'Kendaraan berhasil ditambahkan', data: vehicleService.create(req.user, req.valid.body) });

const update = (req, res) =>
  success(res, {
    message: 'Kendaraan berhasil diperbarui',
    data: vehicleService.update(req.user, req.valid.params.id, req.valid.body),
  });

const remove = (req, res) => {
  vehicleService.remove(req.user, req.valid.params.id);
  return success(res, { message: 'Kendaraan berhasil dihapus' });
};

const history = (req, res) => success(res, { data: vehicleService.history(req.user, req.valid.params.id) });

module.exports = { list, get, create, update, remove, history };
