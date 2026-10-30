const { SlashCommandBuilder, ChannelType, EmbedBuilder } = require('discord.js');
const changelogManager = require('../services/changelogManager');
const { hasPermission } = require('../utils/permission');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setlog')
    .setDescription('Thiết lập kênh nhận changelog khi bot khởi động')
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('Kênh nhận changelog')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!hasPermission(interaction)) {
      return interaction.reply({
        content: '❌ Bạn cần quyền **Administrator** hoặc role được cấu hình để dùng lệnh này.',
        ephemeral: true,
      });
    }

    const channel = interaction.options.getChannel('channel', true);
    await changelogManager.setChannel(interaction.guildId, channel.id);

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('✅ Đã thiết lập kênh changelog')
      .setDescription(`Changelog sẽ được gửi vào ${channel} mỗi khi bot khởi động.`)
      .addFields({ name: '📍 Kênh', value: `${channel} (\`${channel.id}\`)`, inline: false })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
