const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../services/db');
const { checkModerationTarget } = require('../utils/moderationHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Cảnh cáo một thành viên trong máy chủ')
    .addUserOption((option) =>
      option
        .setName('username')
        .setDescription('Thành viên cần cảnh cáo (warn)')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('Lý do cảnh cáo')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  /**
   * Thực thi lệnh /warn
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({
        content: '❌ Lệnh này chỉ có thể sử dụng bên trong máy chủ.',
        ephemeral: true,
      });
    }

    // Kiểm tra quyền của người dùng (ModerateMembers hoặc Administrator)
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({
        content: '❌ Bạn không có quyền **Moderate Members (Quản trị viên / Điều hành viên)** để thực hiện lệnh này.',
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
      actionName: 'cảnh cáo (warn)',
    });

    if (!validation.canAct) {
      return interaction.reply({ content: validation.error, ephemeral: true });
    }

    await interaction.deferReply();

    try {
      // 1. Lưu cảnh cáo vào Database Turso và lấy tổng số lần bị warn
      const { count } = await db.recordModeration({
        guildId: interaction.guild.id,
        userId: targetUser.id,
        userTag: targetUser.tag,
        moderatorId: interaction.user.id,
        moderatorTag: interaction.user.tag,
        actionType: 'warn',
        reason,
      });

      // 2. Gửi tin nhắn DM thông báo riêng cho thành viên (nếu mở DM)
      try {
        const dmEmbed = new EmbedBuilder()
          .setColor(0xF1C40F)
          .setTitle(`⚠️ BẠN ĐÃ NHẬN MỘT CẢNH CÁO TỪ ${interaction.guild.name.toUpperCase()}`)
          .addFields(
            { name: '📝 Lý do', value: reason },
            { name: '🛡️ Người cảnh cáo', value: interaction.user.tag },
            { name: '🔢 Tổng số lần bị cảnh cáo', value: `${count} lần` }
          )
          .setTimestamp();
        await targetUser.send({ embeds: [dmEmbed] });
      } catch (dmErr) {
        // Người dùng có thể đã tắt nhận DM từ server, không làm gián đoạn lệnh
      }

      // 3. Tạo thông báo chi tiết trong kênh
      const embed = new EmbedBuilder()
        .setColor(0xF1C40F) // Vàng
        .setTitle('⚠️ THÀNH VIÊN ĐÃ BỊ CẢNH CÁO (WARN)')
        .setDescription(`Một cảnh cáo chính thức đã được ghi nhận vào hệ thống.`)
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
            value: `**Lần thứ ${count}** (bị warn)`,
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
      console.error('[Warn] Lỗi khi thực hiện lệnh warn:', error);
      return interaction.editReply({
        content: `❌ Không thể ghi nhận cảnh cáo: ${error.message}`,
      });
    }
  },
};
