const { BOOKING_STATUS } = require('../config/constants');
const { isAdmin } = require('../utils/access');
const { todayISO, shiftMonth } = require('../utils/dates');
const statsRepository = require('../repositories/statsRepository');
const reminderService = require('./reminderService');

const MONTHS_BACK = 6;

const zeroFilledStatus = (rows) => {
  const result = Object.fromEntries(Object.values(BOOKING_STATUS).map((status) => [status, 0]));
  rows.forEach(({ status, total }) => {
    result[status] = total;
  });
  return result;
};

/** Seri bulanan 6 bulan terakhir; bulan tanpa data diisi 0 agar grafik tidak bolong. */
const monthlySeries = (rows, today) => {
  const lookup = new Map(rows.map((row) => [row.month, row.total]));
  const currentMonth = today.slice(0, 7);
  return Array.from({ length: MONTHS_BACK }, (_, index) => {
    const month = shiftMonth(currentMonth, index - (MONTHS_BACK - 1));
    return { month, total: lookup.get(month) ?? 0 };
  });
};

const adminDashboard = (today) => {
  const fromMonth = shiftMonth(today.slice(0, 7), -(MONTHS_BACK - 1));
  return {
    role: 'admin',
    totals: statsRepository.adminTotals(today),
    status_counts: zeroFilledStatus(statsRepository.statusCounts()),
    bookings_per_month: monthlySeries(statsRepository.bookingsPerMonth(fromMonth), today),
    revenue_per_month: monthlySeries(statsRepository.revenuePerMonth(fromMonth), today),
    popular_services: statsRepository.popularServices(5),
  };
};

const customerDashboard = (user, today) => {
  const reminders = reminderService.list(user);
  return {
    role: 'customer',
    totals: {
      ...statsRepository.customerTotals(user.id),
      reminders_due: reminders.filter((item) => item.status === 'overdue' || item.status === 'soon').length,
    },
    status_counts: zeroFilledStatus(statsRepository.statusCounts(user.id)),
    today,
  };
};

const dashboard = (user) => {
  const today = todayISO();
  return isAdmin(user) ? adminDashboard(today) : customerDashboard(user, today);
};

module.exports = { dashboard };
