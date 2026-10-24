const { z } = require('zod');
const { pagination } = require('./common');

const list = z.object({
  ...pagination,
  search: z.string().trim().optional(),
});

module.exports = { list };
