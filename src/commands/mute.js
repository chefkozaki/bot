const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../services/db');
const { parseDuration } = require('../utils/duration');
const { checkModerationTarget } = require('../utils/moderationHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Tắt tiếng (timeout) một thành viên trong thời gian nhất định')
    .addUserOption((option) =>
      option
        .setName('username')
        .setDescription('Thành viên cần tắt tiếng')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('time')
        .setDescription('Thời gian tắt tiếng (ví dụ: 10m, 1h, 1d, 7d)')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('Lý do tắt tiếng')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  /**
   * Thực thi lệnh /mute
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
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({
        content: '❌ Bạn không có quyền **Moderate Members (Tắt tiếng / Quản trị viên)** để thực hiện lệnh này.',
        ephemeral: true,
      });
    }

    // Kiểm tra quyền của Bot
    if (!interaction.guild.members.me?.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({
        content: '❌ Bot thiếu quyền **Moderate Members (Tắt tiếng thành viên)** trên máy chủ.',
        ephemeral: true,
      });
    }

    const targetUser = interaction.options.getUser('username');
    const timeInput = interaction.options.getString('time');
    const reason = interaction.options.getString('reason');
    const targetMember = interaction.options.getMember('username');

    if (!targetMember) {
      return interaction.reply({
        content: '❌ Thành viên này hiện không có mặt trong máy chủ để thực hiện tắt tiếng.',
        ephemeral: true,
      });
    }

    // Chuyển đổi định dạng thời gian
    const parsedTime = parseDuration(timeInput);
    if (!parsedTime) {
      return interaction.reply({
        content: '❌ Định dạng thời gian không hợp lệ! Vui lòng nhập định dạng như: `10m` (10 phút), `1h` (1 giờ), `1d` (1 ngày), `7d` (7 ngày).',
        ephemeral: true,
      });
    }

    // Discord giới hạn thời gian timeout tối đa là 28 ngày
    const maxTimeoutMs = 28 * 24 * 60 * 60 * 1000;
    if (parsedTime.ms > maxTimeoutMs) {
      return interaction.reply({
        content: '❌ Thời gian tắt tiếng tối đa mà Discord cho phép là 28 ngày.',
        ephemeral: true,
      });
    }

    // Kiểm tra vai trò & tính hợp lệ
    const validation = checkModerationTarget({
      interaction,
      targetUser,
      targetMember,
      actionName: 'tắt tiếng (mute)',
    });

    if (!validation.canAct) {
      return interaction.reply({ content: validation.error, ephemeral: true });
    }

    await interaction.deferReply();

    try {
      // 1. Áp dụng Timeout trên Discord
      await targetMember.timeout(parsedTime.ms, `${reason} | Xử lý bởi: ${interaction.user.tag}`);

      // 2. Lưu vào Database Turso và lấy tổng số lần bị mute
      const { count } = await db.recordModeration({
        guildId: interaction.guild.id,
        userId: targetUser.id,
        userTag: targetUser.tag,
        moderatorId: interaction.user.id,
        moderatorTag: interaction.user.tag,
        actionType: 'mute',
        reason,
        duration: parsedTime.formatted,
      });

      const unmutedTimestamp = Math.floor((Date.now() + parsedTime.ms) / 1000);

      // 3. Tạo thông báo chi tiết
      const embed = new EmbedBuilder()
        .setColor(0xE67E22) // Cam đậm
        .setTitle('🔇 THÀNH VIÊN ĐÃ BỊ TẮT TIẾNG (MUTE)')
        .setDescription(`Một thành viên đã bị xử lý tắt tiếng (timeout).`)
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
            name: '⏳ Thời hạn tắt tiếng',
            value: `**${parsedTime.formatted}**\n(Hết hạn: <t:${unmutedTimestamp}:R>)`,
            inline: true,
          },
          {
            name: '🔢 Số lần bị xử lý cùng kiểu',
            value: `**Lần thứ ${count}** (bị mute)`,
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
      console.error('[Mute] Lỗi khi thực hiện lệnh mute:', error);
      return interaction.editReply({
        content: `❌ Không thể tắt tiếng thành viên: ${error.message}`,
      });
    }
  },
};
