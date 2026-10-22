const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const channelManager = require('../services/channelManager');
const { hasPermission } = require('../utils/permission');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('disable')
    .setDescription('Tắt bot ở một kênh cụ thể (yêu cầu quyền quản lý)')
    .addChannelOption((option) =>
      option
        .setName('kenh')
        .setDescription('Kênh muốn tắt bot (để trống để tắt kênh hiện tại)')
        .addChannelTypes(
          ChannelType.GuildText,
          ChannelType.GuildAnnouncement,
          ChannelType.PublicThread,
          ChannelType.PrivateThread
        )
        .setRequired(false)
    ),

  /**
   * Xử lý thực thi lệnh /disable
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
        content: '❌ Không xác định được kênh cần tắt.',
        ephemeral: true,
      });
    }

    if (channelManager.isChannelDisabled(targetChannel.id)) {
      return interaction.reply({
        content: `ℹ️ Kênh <#${targetChannel.id}> đã bị tắt bot từ trước đó rồi.`,
        ephemeral: true,
      });
    }

    await channelManager.disableChannel(targetChannel.id);

    const embed = new EmbedBuilder()
      .setColor(0xED4245) // Red
      .setTitle('🔇 Đã Tắt Bot Tại Kênh')
      .setDescription(
        `Bot đã bị tắt tại kênh <#${targetChannel.id}>.\n` +
        `Kể từ bây giờ, Bot sẽ **không phản hồi** tin nhắn hoặc mention tại kênh này.\n\n` +
        `💡 *Để bật lại bot tại kênh này, hãy sử dụng lệnh \`/enable\`.*`
      )
      .addFields(
        { name: '📍 Kênh', value: `<#${targetChannel.id}> (\`${targetChannel.id}\`)`, inline: true },
        { name: '👤 Người thực hiện', value: `${interaction.user}`, inline: true }
      )
      .setFooter({ text: 'Dùng /enable để mở lại bot' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
