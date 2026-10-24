const { z } = require('zod');
const { pagination } = require('./common');

const list = z.object({
  ...pagination,
  vehicle_id: z.coerce.number().int().positive().optional(),
});

const reminders = z.object({
  status: z.enum(['overdue', 'soon', 'ok', 'no_history']).optional(),
});

module.exports = { list, reminders };
