/**
 * Kiểm tra tính hợp lệ của mục tiêu xử lý kỷ luật (Role Hierarchy, Self, Bot, Owner)
 * @param {object} params
 * @param {import('discord.js').ChatInputCommandInteraction} params.interaction
 * @param {import('discord.js').User} params.targetUser
 * @param {import('discord.js').GuildMember|null} [params.targetMember]
 * @param {string} params.actionName Tên hành động tiếng Việt (ví dụ: 'cảnh cáo', 'mute', 'kick', 'ban')
 * @returns {{ canAct: boolean, error?: string }}
 */
function checkModerationTarget({ interaction, targetUser, targetMember, actionName }) {
  if (!interaction.guild) {
    return { canAct: false, error: '❌ Lệnh này chỉ có thể sử dụng bên trong máy chủ Discord.' };
  }

  // 1. Không được xử lý chính mình
  if (targetUser.id === interaction.user.id) {
    return { canAct: false, error: `❌ Bạn không thể tự ${actionName} chính mình!` };
  }

  // 2. Không được xử lý Bot
  if (targetUser.id === interaction.client.user.id) {
    return { canAct: false, error: `❌ Bạn không thể ${actionName} bot!` };
  }

  // 3. Không được xử lý chủ sở hữu server (Owner)
  if (targetUser.id === interaction.guild.ownerId) {
    return { canAct: false, error: `❌ Không thể ${actionName} chủ sở hữu máy chủ!` };
  }

  // Nếu mục tiêu hiện đang có mặt trong server (GuildMember)
  if (targetMember && targetMember.roles) {
    const botMember = interaction.guild.members.me;

    // 4. Kiểm tra quyền hạn Bot so với mục tiêu (Bot phải có Role cao hơn mục tiêu)
    if (botMember && botMember.roles.highest.position <= targetMember.roles.highest.position) {
      return {
        canAct: false,
        error: `❌ Bot không thể ${actionName} thành viên này vì vai trò của họ cao hơn hoặc bằng vai trò cao nhất của Bot!`,
      };
    }

    // 5. Kiểm tra quyền hạn của Người thực thi so với mục tiêu (phải có Role cao hơn mục tiêu, trừ khi là Owner)
    if (
      interaction.user.id !== interaction.guild.ownerId &&
      interaction.member.roles.highest.position <= targetMember.roles.highest.position
    ) {
      return {
        canAct: false,
        error: `❌ Bạn không thể ${actionName} thành viên này vì vai trò của họ cao hơn hoặc bằng vai trò của bạn!`,
      };
    }
  }

  return { canAct: true };
}

module.exports = { checkModerationTarget };
