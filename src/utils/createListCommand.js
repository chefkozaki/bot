const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../services/db');

/**
 * Tạo lệnh xem danh sách kỷ luật (/warnlist, /mutelist, /kicklist, /banlist)
 * @param {object} options
 * @param {string} options.name Tên lệnh (ví dụ: 'warnlist')
 * @param {string} options.actionType Loại hành động ('warn' | 'mute' | 'kick' | 'ban')
 * @param {string} options.actionTitle Tiêu đề hiển thị (ví dụ: 'Cảnh Cáo (Warn)')
 * @param {string} options.actionVerb Động từ (ví dụ: 'bị cảnh cáo')
 * @param {string} options.icon Emoji đại diện
 * @param {number} options.color Mã màu Hex
 */
function createListCommand({ name, actionType, actionTitle, actionVerb, icon, color }) {
  return {
    data: new SlashCommandBuilder()
      .setName(name)
      .setDescription(`Hiển thị danh sách các thành viên ${actionVerb} trên máy chủ`)
      .addUserOption((option) =>
        option
          .setName('username')
          .setDescription('Lọc theo thành viên cụ thể (để trống nếu muốn xem toàn bộ danh sách)')
          .setRequired(false)
      ),

    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
      if (!interaction.guild) {
        return interaction.reply({
          content: '❌ Lệnh này chỉ có thể sử dụng bên trong máy chủ.',
          ephemeral: true,
        });
      }

      await interaction.deferReply();

      const targetUser = interaction.options.getUser('username');

      try {
        // TRƯỜNG HỢP 1: Xem chi tiết của một thành viên cụ thể
        if (targetUser) {
          const records = await db.getUserHistory({
            guildId: interaction.guild.id,
            userId: targetUser.id,
            actionType,
          });

          if (!records || records.length === 0) {
            const emptyEmbed = new EmbedBuilder()
              .setColor(color)
              .setTitle(`${icon} Lịch Sử ${actionTitle}`)
              .setDescription(`Thành viên ${targetUser} (\`${targetUser.tag}\`) chưa từng ${actionVerb} lần nào trên máy chủ này.`)
              .setFooter({ text: 'Hệ thống Moderation • Turso Database' })
              .setTimestamp();
            return interaction.editReply({ embeds: [emptyEmbed] });
          }

          const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(`${icon} Lịch Sử ${actionTitle}: ${targetUser.tag}`)
            .setDescription(`Thành viên ${targetUser} đã ${actionVerb} tổng cộng **${records.length} lần**.`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: 'Hệ thống Moderation • Turso Database' })
            .setTimestamp();

          // Liệt kê tối đa 10 lần gần nhất
          const recentRecords = records.slice(0, 10);
          recentRecords.forEach((record, index) => {
            const timeUnix = record.created_at
              ? Math.floor(new Date(record.created_at + (record.created_at.includes('Z') ? '' : 'Z')).getTime() / 1000)
              : null;
            const timeDisplay = timeUnix && !isNaN(timeUnix) ? `<t:${timeUnix}:f> (<t:${timeUnix}:R>)` : `\`${record.created_at}\``;

            let details = `• **Lý do:** \`${record.reason}\`\n• **Người xử lý:** <@${record.moderator_id}>\n• **Thời gian:** ${timeDisplay}`;
            if (record.duration) {
              details += `\n• **Thời hạn:** \`${record.duration}\``;
            }

            embed.addFields({
              name: `Lần #${records.length - index}`,
              value: details,
              inline: false,
            });
          });

          return interaction.editReply({ embeds: [embed] });
        }

        // TRƯỜNG HỢP 2: Xem tổng hợp toàn bộ các thành viên trên Server
        const summary = await db.getGuildSummary({
          guildId: interaction.guild.id,
          actionType,
        });

        if (!summary || summary.length === 0) {
          const emptyEmbed = new EmbedBuilder()
            .setColor(color)
            .setTitle(`${icon} Danh Sách Thành Viên ${actionTitle}`)
            .setDescription(`Hiện tại máy chủ chưa có thành viên nào ${actionVerb}.`)
            .setFooter({ text: 'Hệ thống Moderation • Turso Database' })
            .setTimestamp();
          return interaction.editReply({ embeds: [emptyEmbed] });
        }

        const embed = new EmbedBuilder()
          .setColor(color)
          .setTitle(`${icon} Danh Sách Thành Viên ${actionTitle}`)
          .setDescription(`Tổng cộng có **${summary.length}** thành viên đã từng ${actionVerb} trên máy chủ.`)
          .setFooter({ text: 'Gõ kèm username để xem chi tiết từng lần • Turso Database' })
          .setTimestamp();

        // Hiển thị tối đa 20 thành viên
        const displayList = summary.slice(0, 20);
        displayList.forEach((item, index) => {
          const reasonsArray = (item.reasons || '').split(' || ');
          const latestReason = reasonsArray[reasonsArray.length - 1] || 'Không có lý do';

          const timeUnix = item.last_at
            ? Math.floor(new Date(item.last_at + (item.last_at.includes('Z') ? '' : 'Z')).getTime() / 1000)
            : null;
          const timeDisplay = timeUnix && !isNaN(timeUnix) ? `<t:${timeUnix}:R>` : item.last_at;

          embed.addFields({
            name: `${index + 1}. ${item.user_tag} (ID: ${item.user_id})`,
            value: `• **Số lần ${actionVerb}:** **${item.total_count} lần**\n• **Lý do gần nhất:** \`${latestReason}\`\n• **Gần nhất:** ${timeDisplay}`,
            inline: false,
          });
        });

        return interaction.editReply({ embeds: [embed] });
      } catch (error) {
        console.error(`[${name}] Lỗi khi truy vấn danh sách:`, error);
        return interaction.editReply({
          content: `❌ Đã xảy ra lỗi khi tải danh sách: ${error.message}`,
        });
      }
    },
  };
}

module.exports = { createListCommand };
