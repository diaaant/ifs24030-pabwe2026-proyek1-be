const { REMINDER } = require('../config/constants');
const { isAdmin } = require('../utils/access');
const { todayISO, diffDays } = require('../utils/dates');
const historyRepository = require('../repositories/historyRepository');

const PRIORITY = { overdue: 0, soon: 1, ok: 2, no_history: 3 };

const resolveStatus = (daysLeft, kmLeft) => {
  const isOverdue = (daysLeft !== null && daysLeft < 0) || (kmLeft !== null && kmLeft < 0);
  if (isOverdue) return 'overdue';

  const isSoon =
    (daysLeft !== null && daysLeft <= REMINDER.SOON_DAYS) || (kmLeft !== null && kmLeft <= REMINDER.SOON_KM);
  return isSoon ? 'soon' : 'ok';
};

const toReminder = (row, today) => {
  if (!row.last_service_date) {
    return { ...row, status: 'no_history', days_left: null, km_left: null };
  }
  const daysLeft = row.next_service_date ? diffDays(today, row.next_service_date) : null;
  const kmLeft = row.next_service_km === null ? null : row.next_service_km - row.odometer;
  return { ...row, status: resolveStatus(daysLeft, kmLeft), days_left: daysLeft, km_left: kmLeft };
};

const byUrgency = (a, b) =>
  PRIORITY[a.status] - PRIORITY[b.status] || (a.days_left ?? Infinity) - (b.days_left ?? Infinity);

const list = (user, { status } = {}) => {
  const today = todayISO();
  const rows = historyRepository.latestPerVehicle(isAdmin(user) ? null : user.id);
  return rows
    .map((row) => toReminder(row, today))
    .filter((reminder) => !status || reminder.status === status)
    .sort(byUrgency);
};

module.exports = { list, toReminder };
