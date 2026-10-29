const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../services/db');
const { checkModerationTarget } = require('../utils/moderationHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Cấm một thành viên khỏi máy chủ')
    .addUserOption((option) =>
      option
        .setName('username')
        .setDescription('Thành viên cần cấm (ban)')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('Lý do cấm')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  /**
   * Thực thi lệnh /ban
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({
        content: '❌ Lệnh này chỉ có thể sử dụng bên trong máy chủ.',
        ephemeral: true,
      });
    }

    // Kiểm tra quyền của người dùng
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({
        content: '❌ Bạn không có quyền **Ban Members (Cấm thành viên)** để thực hiện lệnh này.',
        ephemeral: true,
      });
    }

    // Kiểm tra quyền của Bot
    if (!interaction.guild.members.me?.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({
        content: '❌ Bot thiếu quyền **Ban Members (Cấm thành viên)** trên máy chủ.',
        ephemeral: true,
      });
    }

    const targetUser = interaction.options.getUser('username');
    const reason = interaction.options.getString('reason');
    const targetMember = interaction.options.getMember('username');

    // Kiểm tra vai trò & tính hợp lệ
    const validation = checkModerationTarget({
      interaction,
      targetUser,
      targetMember,
      actionName: 'cấm (ban)',
    });

    if (!validation.canAct) {
      return interaction.reply({ content: validation.error, ephemeral: true });
    }

    await interaction.deferReply();

    try {
      // 1. Thực hiện lệnh Ban trên Discord
      await interaction.guild.bans.create(targetUser.id, {
        reason: `${reason} | Xử lý bởi: ${interaction.user.tag}`,
      });

      // 2. Lưu vào Database Turso và lấy tổng số lần bị ban
      const { count } = await db.recordModeration({
        guildId: interaction.guild.id,
        userId: targetUser.id,
        userTag: targetUser.tag,
        moderatorId: interaction.user.id,
        moderatorTag: interaction.user.tag,
        actionType: 'ban',
        reason,
      });

      // 3. Tạo thông báo chi tiết
      const embed = new EmbedBuilder()
        .setColor(0xE74C3C) // Đỏ
        .setTitle('🔨 THÀNH VIÊN ĐÃ BỊ CẤM (BAN)')
        .setDescription(`Một thành viên đã bị xử lý kỷ luật khỏi máy chủ.`)
        .addFields(
          {
            name: '👤 Thành viên bị xử lý',
            value: `${targetUser} (\`${targetUser.tag}\` | ID: \`${targetUser.id}\`)`,
            inline: false,
          },
          {
            name: '🛡️ Người xử lý',
            value: `${interaction.user} (\`${interaction.user.tag}\`)`,
            inline: true,
          },
          {
            name: '🔢 Số lần bị xử lý cùng kiểu',
            value: `**Lần thứ ${count}** (bị ban)`,
            inline: true,
          },
          {
            name: '📝 Lý do xử lý',
            value: `\`\`\`${reason}\`\`\``,
            inline: false,
          }
        )
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: `Hệ thống Moderation • Turso Database` })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('[Ban] Lỗi khi thực hiện lệnh ban:', error);
      return interaction.editReply({
        content: `❌ Không thể cấm thành viên: ${error.message}`,
      });
    }
  },
};
