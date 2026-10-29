const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const promptManager = require('../services/promptManager');
const config = require('../config');
const changesysCommand = require('../commands/changesys');

// Nạp tự động các commands từ thư mục commands
const commands = new Map();
const commandsPath = path.join(__dirname, '../commands');
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
  for (const file of commandFiles) {
    try {
      const command = require(path.join(commandsPath, file));
      if (command && command.data && command.data.name) {
        commands.set(command.data.name, command);
      }
    } catch (err) {
      console.error(`[Interaction] Lỗi khi nạp file lệnh ${file}:`, err);
    }
  }
}

/**
 * Xử lý tất cả các tương tác (Slash command, Modal submit,...)
 * @param {import('discord.js').Interaction} interaction
 * @param {import('discord.js').Client} client
 */
async function handleInteractionCreate(interaction, client) {
  try {
    // 1. Xử lý Slash Commands (ChatInputCommand)
    if (interaction.isChatInputCommand()) {
      const { commandName } = interaction;
      const command = commands.get(commandName);

      if (command && typeof command.execute === 'function') {
        return await command.execute(interaction);
      }
    }

    // 2. Xử lý Modal Submit (khi người dùng gửi bảng soạn thảo đa dòng của /changesys)
    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'changesys_modal') {
        // Kiểm tra lại quyền hạn để đảm bảo an toàn tuyệt đối
        if (!changesysCommand.hasPermission(interaction)) {
          return interaction.reply({
            content: '❌ **Từ chối truy cập!** Bạn không có quyền thay đổi System Prompt.',
            ephemeral: true,
          });
        }

        const newPrompt = interaction.fields.getTextInputValue('changesys_input');
        await promptManager.setSystemPrompt(newPrompt);

        let displayPrompt = newPrompt;
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
    }
  } catch (error) {
    console.error(`[Interaction] Lỗi khi xử lý tương tác ${interaction.id}:`, error);

    const errorMessage = '⚠️ Đã xảy ra lỗi khi thực thi lệnh này.';
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: errorMessage, ephemeral: true }).catch(() => {});
    } else {
      await interaction.reply({ content: errorMessage, ephemeral: true }).catch(() => {});
    }
  }
}

module.exports = { handleInteractionCreate };
