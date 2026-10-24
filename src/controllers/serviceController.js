const { success } = require('../utils/response');
const catalogService = require('../services/catalogService');

const list = (req, res) => success(res, { data: catalogService.list(req.valid.query, req.user) });

const get = (req, res) => success(res, { data: catalogService.get(req.valid.params.id) });

const create = (req, res) =>
  success(res, { status: 201, message: 'Layanan berhasil ditambahkan', data: catalogService.create(req.valid.body) });

const update = (req, res) =>
  success(res, { message: 'Layanan berhasil diperbarui', data: catalogService.update(req.valid.params.id, req.valid.body) });

const remove = (req, res) => {
  const { deactivated } = catalogService.remove(req.valid.params.id);
  return success(res, {
    message: deactivated
      ? 'Layanan pernah dibooking sehingga dinonaktifkan, bukan dihapus'
      : 'Layanan berhasil dihapus',
    data: { deactivated },
  });
};

module.exports = { list, get, create, update, remove };
