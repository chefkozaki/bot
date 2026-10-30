const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config');

/**
 * Tải danh sách Slash Commands động từ thư mục commands,
 * đồng thời xoá require cache để luôn lấy nội dung mới nhất của các file lệnh.
 * @returns {Array<{ name: string, data: object }>}
 */
function loadCommands() {
  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
  const commands = [];

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    // Xoá cache của require để reset bộ nhớ đệm cho file lệnh
    delete require.cache[require.resolve(filePath)];

    try {
      const command = require(filePath);
      if (command && command.data) {
        commands.push({
          name: command.data.name,
          data: typeof command.data.toJSON === 'function' ? command.data.toJSON() : command.data,
        });
      } else {
        console.warn(`[Deploy] ⚠️ File "${file}" không xuất thuộc tính "data" hợp lệ.`);
      }
    } catch (error) {
      console.error(`[Deploy] ❌ Lỗi khi đọc file lệnh "${file}":`, error.message);
    }
  }

  return commands;
}

/**
 * Triển khai Slash Commands cho danh sách Guild được cấu hình hoặc ở chế độ Global.
 */
async function deployCommands() {
  if (!config.discordToken || !config.clientId) {
    console.error('[Deploy] ❌ Thiếu DISCORD_TOKEN hoặc CLIENT_ID trong file .env. Không thể đăng ký lệnh.');
    return;
  }

  const rest = new REST({ version: '10' }).setToken(config.discordToken);

  try {
    // 1. Reset cache và tải danh sách lệnh mới nhất từ disk
    console.log('[Deploy] 🔄 Đang làm mới bộ nhớ đệm (cache) và tải danh sách lệnh từ src/commands...');
    const loadedCommands = loadCommands();
    const commandPayloads = loadedCommands.map((c) => c.data);
    const commandNames = loadedCommands.map((c) => `/${c.name}`).join(', ');

    console.log(`[Deploy] 📦 Đã tải ${loadedCommands.length} lệnh: ${commandNames || 'Không có lệnh nào'}`);

    const guildIds = [...new Set(config.guildIds)].filter(Boolean);

    if (guildIds.length > 0) {
      console.log(`[Deploy] 🎯 Đang đăng ký lệnh ngay lập tức cho ${guildIds.length} server...`);

      for (const guildId of guildIds) {
        try {
          const registered = await rest.put(
            Routes.applicationGuildCommands(config.clientId, guildId),
            { body: commandPayloads }
          );
          console.log(`[Deploy] ✅ Đã đăng ký ${registered.length} lệnh cho Server ${guildId}: ${commandNames}`);
        } catch (error) {
          console.error(`[Deploy] ❌ Không thể đăng ký lệnh cho Server ${guildId}:`, error.message);
        }
      }
    } else {
      console.log('[Deploy] 🌐 Không có GUILD_IDS; đang đăng ký lệnh ở chế độ Global...');

      await rest.put(
        Routes.applicationCommands(config.clientId),
        { body: [] }
      );

      const registered = await rest.put(
        Routes.applicationCommands(config.clientId),
        { body: commandPayloads }
      );
      console.log(`[Deploy] ✅ Đã cập nhật thành công ${registered.length} lệnh Global: ${commandNames}`);
      console.log('[Deploy] ℹ️ Discord có thể mất vài phút đến 1 giờ để đồng bộ lệnh Global tới tất cả máy chủ.');
    }
  } catch (error) {
    console.error('[Deploy] ❌ Lỗi khi triển khai Slash Commands:', error);
  }
}

// Nếu chạy trực tiếp từ dòng lệnh: node src/deploy.js
if (require.main === module) {
  deployCommands();
}

module.exports = { deployCommands, loadCommands };
