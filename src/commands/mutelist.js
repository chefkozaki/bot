const { createListCommand } = require('../utils/createListCommand');

module.exports = createListCommand({
  name: 'mutelist',
  actionType: 'mute',
  actionTitle: 'Tắt Tiếng (Mute)',
  actionVerb: 'bị tắt tiếng',
  icon: '🔇',
  color: 0xE67E22,
});
