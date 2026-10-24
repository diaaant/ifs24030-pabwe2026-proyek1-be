const AppError = require('../utils/AppError');
const { assertOwnerOrAdmin, isAdmin } = require('../utils/access');
const { buildMeta } = require('../utils/response');
const { toPaging } = require('../utils/pagination');
const { compact } = require('../utils/dates');
const historyRepository = require('../repositories/historyRepository');

const invoiceNumber = (record) => `INV-${compact(record.service_date)}-${String(record.id).padStart(4, '0')}`;

const withInvoice = (record) => ({ ...record, invoice_number: invoiceNumber(record) });

const list = (user, { vehicle_id: vehicleId, ...paging }) => {
  const { page, limit, offset } = toPaging(paging);
  const filter = { userId: isAdmin(user) ? null : user.id, vehicleId };
  return {
    items: historyRepository.list({ ...filter, limit, offset }).map(withInvoice),
    meta: buildMeta(page, limit, historyRepository.count(filter)),
  };
};

/** Detail riwayat sekaligus data invoice yang siap dicetak. */
const get = (user, id) => {
  const record = historyRepository.findById(id);
  if (!record) throw new AppError(404, 'Riwayat servis tidak ditemukan');
  assertOwnerOrAdmin(user, record.user_id, 'Riwayat servis tidak ditemukan');
  return withInvoice(record);
};

module.exports = { list, get, withInvoice };
