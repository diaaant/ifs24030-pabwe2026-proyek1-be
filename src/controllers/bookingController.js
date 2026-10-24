const { success } = require('../utils/response');
const bookingService = require('../services/bookingService');

const availability = (req, res) => success(res, { data: bookingService.getAvailability(req.valid.query.date) });

const list = (req, res) => {
  const { items, meta } = bookingService.list(req.user, req.valid.query);
  return success(res, { data: items, meta });
};

const get = (req, res) => success(res, { data: bookingService.get(req.user, req.valid.params.id) });

const create = (req, res) =>
  success(res, { status: 201, message: 'Booking berhasil dibuat', data: bookingService.create(req.user, req.valid.body) });

const cancel = (req, res) =>
  success(res, { message: 'Booking dibatalkan', data: bookingService.cancel(req.user, req.valid.params.id) });

const updateStatus = (req, res) =>
  success(res, {
    message: 'Status booking diperbarui',
    data: bookingService.updateStatus(req.valid.params.id, req.valid.body),
  });

const complete = (req, res) =>
  success(res, {
    message: 'Servis selesai dan riwayat tersimpan',
    data: bookingService.complete(req.valid.params.id, req.valid.body),
  });

module.exports = { availability, list, get, create, cancel, updateStatus, complete };
