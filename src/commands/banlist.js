const { createListCommand } = require('../utils/createListCommand');

module.exports = createListCommand({
  name: 'banlist',
  actionType: 'ban',
  actionTitle: 'Cấm (Ban)',
  actionVerb: 'bị cấm',
  icon: '🔨',
  color: 0xE74C3C,
});
