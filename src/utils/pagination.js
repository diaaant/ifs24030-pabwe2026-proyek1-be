/** Ubah query page/limit menjadi limit & offset SQL. */
const toPaging = ({ page = 1, limit = 10 } = {}) => ({
  page,
  limit,
  offset: (page - 1) * limit,
});

module.exports = { toPaging };
