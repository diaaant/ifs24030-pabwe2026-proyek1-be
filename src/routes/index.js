const { Router } = require('express');

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'BengkelKu API berjalan', data: { time: new Date().toISOString() } });
});

router.use('/auth', require('./authRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/vehicles', require('./vehicleRoutes'));
router.use('/services', require('./serviceRoutes'));
router.use('/bookings', require('./bookingRoutes'));
router.use('/history', require('./historyRoutes'));
router.use('/reminders', require('./reminderRoutes'));
router.use('/stats', require('./statsRoutes'));

module.exports = router;
