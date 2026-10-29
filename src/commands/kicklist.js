const { createListCommand } = require('../utils/createListCommand');

module.exports = createListCommand({
  name: 'kicklist',
  actionType: 'kick',
  actionTitle: 'Trục Xuất (Kick)',
  actionVerb: 'bị trục xuất',
  icon: '👢',
  color: 0xF39C12,
});
