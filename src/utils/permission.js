const { PermissionFlagsBits } = require('discord.js');
const config = require('../config');

/**
 * Kiểm tra xem người dùng có quyền quản trị hoặc Role được phép hay không
 * @param {import('discord.js').ChatInputCommandInteraction | import('discord.js').ModalSubmitInteraction} interaction
 * @returns {boolean}
 */
function hasPermission(interaction) {
  if (!interaction.inGuild() || !interaction.member) {
    return false;
  }

  // Người có quyền Administrator luôn được phép
  if (interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    return true;
  }

  const memberRoles = interaction.member.roles?.cache;
  if (!memberRoles) return false;

  // Kiểm tra theo danh sách Allowed Role ID
  if (config.allowedRoleIds.length > 0) {
    const hasAllowedId = memberRoles.some((role) =>
      config.allowedRoleIds.includes(role.id)
    );
    if (hasAllowedId) return true;
  }

  // Kiểm tra theo danh sách Allowed Role Name
  if (config.allowedRoleNames.length > 0) {
    const hasAllowedName = memberRoles.some((role) =>
      config.allowedRoleNames.includes(role.name.toLowerCase())
    );
    if (hasAllowedName) return true;
  }

  return false;
}

module.exports = { hasPermission };
