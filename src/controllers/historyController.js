const { success } = require('../utils/response');
const historyService = require('../services/historyService');
const reminderService = require('../services/reminderService');

const list = (req, res) => {
  const { items, meta } = historyService.list(req.user, req.valid.query);
  return success(res, { data: items, meta });
};

const get = (req, res) => success(res, { data: historyService.get(req.user, req.valid.params.id) });

const reminders = (req, res) => success(res, { data: reminderService.list(req.user, req.valid.query) });

module.exports = { list, get, reminders };
