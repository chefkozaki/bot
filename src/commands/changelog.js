const { SlashCommandBuilder } = require('discord.js');
const changelogManager = require('../services/changelogManager');
const { splitMessage } = require('../utils/splitMessage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('changelog')
    .setDescription('Hiển thị toàn bộ changelog của bot'),

  async execute(interaction) {
    const changelog = await changelogManager.getChangelog();
    if (!changelog) {
      return interaction.reply({
        content: '❌ Không tìm thấy file `changelog.md`.',
        ephemeral: true,
      });
    }

    await interaction.deferReply();
    const chunks = splitMessage(changelog, { maxLength: 1900 });
    await interaction.editReply({ content: chunks[0] });
    for (const chunk of chunks.slice(1)) {
      await interaction.followUp({ content: chunk });
    }
  },
};
