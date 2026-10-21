const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const promptManager = require('../services/promptManager');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('getsys')
    .setDescription('Hiển thị System Prompt hiện tại của Bot')
    .addBooleanOption((option) =>
      option
        .setName('an_danh')
        .setDescription('Chỉ một mình bạn nhìn thấy kết quả (ephemeral) hay hiển thị công khai?')
        .setRequired(false)
    ),

  /**
   * Xử lý thực thi lệnh /getsys
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const isEphemeral = interaction.options.getBoolean('an_danh') ?? false;
    const currentPrompt = promptManager.getSystemPrompt();
    const lastUpdated = promptManager.getLastUpdated();

    const formattedTime = `<t:${Math.floor(lastUpdated.getTime() / 1000)}:F>`;

    // Embed giới hạn Description là 4096 ký tự
    let displayPrompt = currentPrompt;
    let isTruncated = false;
    if (displayPrompt.length > 3800) {
      displayPrompt = displayPrompt.slice(0, 3800) + '...\n*(Đã bị cắt do quá dài)*';
      isTruncated = true;
    }

    const embed = new EmbedBuilder()
      .setColor(0x4285F4) // Google Blue
      .setTitle('📋 System Prompt Hiện Tại')
      .setDescription(`\`\`\`txt\n${displayPrompt}\n\`\`\``)
      .addFields(
        { name: '🤖 AI Model', value: `\`${config.geminiModel}\``, inline: true },
        { name: '🕒 Cập nhật lần cuối', value: formattedTime, inline: true }
      )
      .setFooter({ text: 'Google Gemini AI Discord Bot' })
      .setTimestamp();

    if (isTruncated) {
      embed.addFields({
        name: '⚠️ Lưu ý',
        value: 'System Prompt quá dài để hiển thị trọn vẹn trong một Embed, nhưng Bot vẫn tải đầy đủ khi gửi đến AI.',
      });
    }

    await interaction.reply({
      embeds: [embed],
      ephemeral: isEphemeral,
    });
  },
};
