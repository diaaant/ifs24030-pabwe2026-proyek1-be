const { success } = require('../utils/response');
const statsService = require('../services/statsService');

const dashboard = (req, res) => success(res, { data: statsService.dashboard(req.user) });

module.exports = { dashboard };
