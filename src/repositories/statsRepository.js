const { getDb } = require('../db/connection');

const one = (sql, params = {}) => getDb().prepare(sql).get(params);
const all = (sql, params = {}) => getDb().prepare(sql).all(params);

const adminTotals = (today) => ({
  ...one(`SELECT
      (SELECT COUNT(*) FROM users WHERE role = 'customer') AS customers,
      (SELECT COUNT(*) FROM vehicles) AS vehicles,
      (SELECT COUNT(*) FROM bookings) AS bookings,
      (SELECT COALESCE(SUM(total_cost), 0) FROM service_history) AS revenue,
      (SELECT COUNT(*) FROM bookings WHERE booking_date = @today AND status != 'cancelled') AS today_bookings,
      (SELECT COUNT(*) FROM bookings WHERE status = 'pending') AS pending_bookings`, { today }),
});

const statusCounts = (userId) =>
  all(
    `SELECT status, COUNT(*) AS total FROM bookings WHERE (@userId IS NULL OR user_id = @userId) GROUP BY status`,
    { userId: userId ?? null },
  );

const bookingsPerMonth = (fromMonth) =>
  all(
    `SELECT substr(booking_date, 1, 7) AS month, COUNT(*) AS total
     FROM bookings WHERE substr(booking_date, 1, 7) >= @fromMonth AND status != 'cancelled'
     GROUP BY month ORDER BY month`,
    { fromMonth },
  );

const revenuePerMonth = (fromMonth) =>
  all(
    `SELECT substr(service_date, 1, 7) AS month, COALESCE(SUM(total_cost), 0) AS total
     FROM service_history WHERE substr(service_date, 1, 7) >= @fromMonth
     GROUP BY month ORDER BY month`,
    { fromMonth },
  );

const popularServices = (limit = 5) =>
  all(
    `SELECT s.id, s.name, COUNT(*) AS total
     FROM bookings b JOIN services s ON s.id = b.service_id
     WHERE b.status != 'cancelled' GROUP BY s.id ORDER BY total DESC, s.name LIMIT @limit`,
    { limit },
  );

const customerTotals = (userId) =>
  one(
    `SELECT
      (SELECT COUNT(*) FROM vehicles WHERE user_id = @userId) AS vehicles,
      (SELECT COUNT(*) FROM bookings WHERE user_id = @userId AND status IN ('pending','confirmed','in_progress')) AS active_bookings,
      (SELECT COUNT(*) FROM service_history WHERE user_id = @userId) AS services_done,
      (SELECT COALESCE(SUM(total_cost), 0) FROM service_history WHERE user_id = @userId) AS total_spent`,
    { userId },
  );

module.exports = {
  adminTotals,
  statusCounts,
  bookingsPerMonth,
  revenuePerMonth,
  popularServices,
  customerTotals,
};
