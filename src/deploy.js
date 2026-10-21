const { REST, Routes } = require('discord.js');
const config = require('./config');
const getsysCommand = require('./commands/getsys');
const changesysCommand = require('./commands/changesys');

const commands = [
  getsysCommand.data.toJSON(),
  changesysCommand.data.toJSON(),
];

async function deployCommands() {
  if (!config.discordToken || !config.clientId) {
    console.error('[Deploy] Thiếu DISCORD_TOKEN hoặc CLIENT_ID trong file .env. Không thể đăng ký lệnh.');
    return;
  }

  const rest = new REST({ version: '10' }).setToken(config.discordToken);

  try {
    console.log(`[Deploy] Bắt đầu đăng ký ${commands.length} slash commands...`);

    if (config.guildId) {
      console.log(`[Deploy] Đang đăng ký cho Server cụ thể (Guild ID: ${config.guildId})...`);
      await rest.put(
        Routes.applicationGuildCommands(config.clientId, config.guildId),
        { body: commands }
      );
      console.log('✅ Đã đăng ký Slash Commands thành công cho Server!');
    } else {
      console.log('[Deploy] Đang đăng ký Slash Commands Toàn Cục (Global)...');
      await rest.put(
        Routes.applicationCommands(config.clientId),
        { body: commands }
      );
      console.log('✅ Đã đăng ký Slash Commands Toàn Cục (Global) thành công!');
    }
  } catch (error) {
    console.error('[Deploy] Lỗi khi đăng ký Slash Commands:', error);
  }
}

// Nếu chạy trực tiếp từ dòng lệnh: node src/deploy.js
if (require.main === module) {
  deployCommands();
}

module.exports = { deployCommands };
