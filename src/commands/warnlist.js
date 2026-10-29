const { createListCommand } = require('../utils/createListCommand');

module.exports = createListCommand({
  name: 'warnlist',
  actionType: 'warn',
  actionTitle: 'Cảnh Cáo (Warn)',
  actionVerb: 'bị cảnh cáo',
  icon: '⚠️',
  color: 0xF1C40F,
});
