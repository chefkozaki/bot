const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require('discord.js');
const promptManager = require('../services/promptManager');
const config = require('../config');

/**
 * Kiểm tra xem người dùng có quyền thay đổi System Prompt hay không
 * @param {import('discord.js').ChatInputCommandInteraction | import('discord.js').ModalSubmitInteraction} interaction
 * @returns {boolean}
 */
function hasPermission(interaction) {
  if (!interaction.inGuild() || !interaction.member) {
    return false;
  }

  // Người có quyền Administrator luôn được phép
  if (interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    return true;
  }

  const memberRoles = interaction.member.roles?.cache;
  if (!memberRoles) return false;

  // Kiểm tra theo danh sách Allowed Role ID
  if (config.allowedRoleIds.length > 0) {
    const hasAllowedId = memberRoles.some((role) =>
      config.allowedRoleIds.includes(role.id)
    );
    if (hasAllowedId) return true;
  }

  // Kiểm tra theo danh sách Allowed Role Name
  if (config.allowedRoleNames.length > 0) {
    const hasAllowedName = memberRoles.some((role) =>
      config.allowedRoleNames.includes(role.name.toLowerCase())
    );
    if (hasAllowedName) return true;
  }

  return false;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('changesys')
    .setDescription('Thay đổi System Prompt cho AI (yêu cầu role được chỉ định)')
    .addStringOption((option) =>
      option
        .setName('prompt')
        .setDescription('Nội dung System Prompt mới (bỏ trống để mở bảng soạn thảo đa dòng)')
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName('reset_mac_dinh')
        .setDescription('Đặt lại System Prompt về giá trị mặc định ban đầu')
        .setRequired(false)
    ),

  hasPermission,

  /**
   * Xử lý thực thi lệnh /changesys
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    // 1. Kiểm tra quyền hạn của người dùng
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

    const resetDefault = interaction.options.getBoolean('reset_mac_dinh');
    const newPromptInput = interaction.options.getString('prompt');

    // 2. Trường hợp muốn reset về mặc định
    if (resetDefault) {
      const defaultPrompt = promptManager.getDefaultPrompt();
      await promptManager.setSystemPrompt(defaultPrompt);

      const embed = new EmbedBuilder()
        .setColor(0x00c853) // Green
        .setTitle('✅ Đã Khôi Phục System Prompt Mặc Định')
        .setDescription(`\`\`\`txt\n${defaultPrompt}\n\`\`\``)
        .addFields({ name: 'Thực hiện bởi', value: `${interaction.user.tag}`, inline: true })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    // 3. Trường hợp truyền prompt trực tiếp qua option
    if (newPromptInput) {
      await promptManager.setSystemPrompt(newPromptInput);

      let displayPrompt = newPromptInput;
      if (displayPrompt.length > 3800) {
        displayPrompt = displayPrompt.slice(0, 3800) + '...\n*(Đã cắt bớt khi hiển thị)*';
      }

      const embed = new EmbedBuilder()
        .setColor(0x00c853) // Green
        .setTitle('✅ Đã Cập Nhật System Prompt Thành Công')
        .setDescription(`\`\`\`txt\n${displayPrompt}\n\`\`\``)
        .addFields(
          { name: '👤 Người cập nhật', value: `${interaction.user}`, inline: true },
          { name: '🤖 AI Model', value: `\`${config.groqModel}\``, inline: true }
        )
        .setFooter({ text: 'System Prompt mới sẽ được áp dụng ngay lập tức cho các câu hỏi tiếp theo.' })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    // 4. Nếu không truyền prompt và không reset -> Mở Modal soạn thảo đa dòng
    const currentPrompt = promptManager.getSystemPrompt();

    const modal = new ModalBuilder()
      .setCustomId('changesys_modal')
      .setTitle('Soạn Thảo System Prompt');

    const promptInput = new TextInputBuilder()
      .setCustomId('changesys_input')
      .setLabel('Nội dung System Prompt mới:')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Nhập hướng dẫn phong cách, kiến thức và thái độ cho bot...')
      .setValue(currentPrompt.slice(0, 4000))
      .setRequired(true)
      .setMaxLength(4000);

    const actionRow = new ActionRowBuilder().addComponents(promptInput);
    modal.addComponents(actionRow);

    await interaction.showModal(modal);
  },
};
