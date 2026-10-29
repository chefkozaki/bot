const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../services/db');
const { checkModerationTarget } = require('../utils/moderationHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Trục xuất một thành viên khỏi máy chủ')
    .addUserOption((option) =>
      option
        .setName('username')
        .setDescription('Thành viên cần trục xuất (kick)')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('Lý do trục xuất')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  /**
   * Thực thi lệnh /kick
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
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.KickMembers)) {
      return interaction.reply({
        content: '❌ Bạn không có quyền **Kick Members (Trục xuất thành viên)** để thực hiện lệnh này.',
        ephemeral: true,
      });
    }

    // Kiểm tra quyền của Bot
    if (!interaction.guild.members.me?.permissions.has(PermissionFlagsBits.KickMembers)) {
      return interaction.reply({
        content: '❌ Bot thiếu quyền **Kick Members (Trục xuất thành viên)** trên máy chủ.',
        ephemeral: true,
      });
    }

    const targetUser = interaction.options.getUser('username');
    const reason = interaction.options.getString('reason');
    const targetMember = interaction.options.getMember('username');

    if (!targetMember) {
      return interaction.reply({
        content: '❌ Thành viên này hiện không có mặt trong máy chủ để thực hiện kick.',
        ephemeral: true,
      });
    }

    // Kiểm tra vai trò & tính hợp lệ
    const validation = checkModerationTarget({
      interaction,
      targetUser,
      targetMember,
      actionName: 'trục xuất (kick)',
    });

    if (!validation.canAct) {
      return interaction.reply({ content: validation.error, ephemeral: true });
    }

    await interaction.deferReply();

    try {
      // 1. Thực hiện Kick trên Discord
      await targetMember.kick(`${reason} | Xử lý bởi: ${interaction.user.tag}`);

      // 2. Lưu vào Database Turso và lấy tổng số lần bị kick
      const { count } = await db.recordModeration({
        guildId: interaction.guild.id,
        userId: targetUser.id,
        userTag: targetUser.tag,
        moderatorId: interaction.user.id,
        moderatorTag: interaction.user.tag,
        actionType: 'kick',
        reason,
      });

      // 3. Tạo thông báo chi tiết
      const embed = new EmbedBuilder()
        .setColor(0xF39C12) // Cam vàng
        .setTitle('👢 THÀNH VIÊN ĐÃ BỊ TRỤC XUẤT (KICK)')
        .setDescription(`Một thành viên đã bị trục xuất khỏi máy chủ.`)
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
            value: `**Lần thứ ${count}** (bị kick)`,
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
      console.error('[Kick] Lỗi khi thực hiện lệnh kick:', error);
      return interaction.editReply({
        content: `❌ Không thể trục xuất thành viên: ${error.message}`,
      });
    }
  },
};
