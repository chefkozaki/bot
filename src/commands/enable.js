const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const channelManager = require('../services/channelManager');
const { hasPermission } = require('../utils/permission');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('enable')
    .setDescription('Bật lại bot ở một kênh cụ thể (yêu cầu quyền quản lý)')
    .addChannelOption((option) =>
      option
        .setName('kenh')
        .setDescription('Kênh muốn bật lại bot (để trống để bật kênh hiện tại)')
        .addChannelTypes(
          ChannelType.GuildText,
          ChannelType.GuildAnnouncement,
          ChannelType.PublicThread,
          ChannelType.PrivateThread
        )
        .setRequired(false)
    ),

  /**
   * Xử lý thực thi lệnh /enable
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    if (!hasPermission(interaction)) {
      let allowedNotice = 'Bạn cần có Role được chỉ định';
      if (config.allowedRoleIds.length > 0) {
        allowedNotice += ` (Role ID: \`${config.allowedRoleIds.join(', ')}\`)`;
      } else if (config.allowedRoleNames.length > 0) {
        allowedNotice += ` (Role: \`${config.allowedRoleNames.join(', ')}\`)`;
      }
      allowedNotice += ' hoặc quyền **Administrator** trên máy chủ để dùng lệnh này.';

      return interaction.reply({
        content: `❌ **Từ chối truy cập!**\n${allowedNotice}`,
        ephemeral: true,
      });
    }

    const targetChannel = interaction.options.getChannel('kenh') || interaction.channel;

    if (!targetChannel) {
      return interaction.reply({
        content: '❌ Không xác định được kênh cần bật lại.',
        ephemeral: true,
      });
    }

    if (!channelManager.isChannelDisabled(targetChannel.id)) {
      return interaction.reply({
        content: `ℹ️ Kênh <#${targetChannel.id}> đang hoạt động bình thường (không bị tắt).`,
        ephemeral: true,
      });
    }

    await channelManager.enableChannel(targetChannel.id);

    const embed = new EmbedBuilder()
      .setColor(0x57F287) // Green
      .setTitle('🔔 Đã Bật Lại Bot Tại Kênh')
      .setDescription(
        `Bot đã được bật lại tại kênh <#${targetChannel.id}>.\n` +
        `Bot sẽ tiếp tục phản hồi khi được ping tại kênh này.`
      )
      .addFields(
        { name: '📍 Kênh', value: `<#${targetChannel.id}> (\`${targetChannel.id}\`)`, inline: true },
        { name: '👤 Người thực hiện', value: `${interaction.user}`, inline: true }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
