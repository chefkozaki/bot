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
 * Triển khai Slash Commands:
 * 1. Reset bộ nhớ đệm (cache) và nạp danh sách lệnh mới nhất.
 * 2. Xoá sạch toàn bộ các lệnh cũ trên Discord (Guild và Global).
 * 3. Đăng ký và cập nhật danh sách lệnh mới lên Discord API.
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

    if (config.guildId) {
      // --- TRIỂN KHAI CHO SERVER CỤ THỂ (GUILD) ---
      console.log(`[Deploy] 🎯 Đang cấu hình cho Server cụ thể (Guild ID: ${config.guildId})...`);

      // 2. Xoá sạch các lệnh cũ trên Guild
      console.log('[Deploy] 🗑️ Đang xoá toàn bộ lệnh cũ trên Guild...');
      await rest.put(
        Routes.applicationGuildCommands(config.clientId, config.guildId),
        { body: [] }
      );
      console.log('[Deploy] ✅ Đã xoá toàn bộ lệnh cũ trên Guild thành công.');

      // 3. Xoá các lệnh Global cũ (nếu có) để tránh hiện tượng trùng lặp hoặc ghost commands trên server
      try {
        console.log('[Deploy] 🧹 Đang dọn dẹp các lệnh Global cũ (nếu có)...');
        await rest.put(
          Routes.applicationCommands(config.clientId),
          { body: [] }
        );
        console.log('[Deploy] ✅ Đã dọn dẹp các lệnh Global cũ thành công.');
      } catch (globalErr) {
        console.warn('[Deploy] ⚠️ Không thể dọn dẹp lệnh Global cũ (có thể bỏ qua):', globalErr.message);
      }

      // 4. Đăng ký danh sách lệnh mới cho Guild
      console.log(`[Deploy] 🚀 Đang cập nhật ${commandPayloads.length} lệnh mới cho Guild...`);
      const registered = await rest.put(
        Routes.applicationGuildCommands(config.clientId, config.guildId),
        { body: commandPayloads }
      );
      console.log(`[Deploy] ✅ Đã cập nhật thành công ${registered.length} lệnh mới cho Server: ${commandNames}`);
    } else {
      // --- TRIỂN KHAI TOÀN CỤC (GLOBAL) ---
      console.log('[Deploy] 🌐 Đang cấu hình cho chế độ Toàn Cục (Global)...');

      // 2. Xoá sạch toàn bộ lệnh Global cũ
      console.log('[Deploy] 🗑️ Đang xoá toàn bộ lệnh Global cũ...');
      await rest.put(
        Routes.applicationCommands(config.clientId),
        { body: [] }
      );
      console.log('[Deploy] ✅ Đã xoá toàn bộ lệnh Global cũ thành công.');

      // 3. Đăng ký danh sách lệnh mới Toàn Cục
      console.log(`[Deploy] 🚀 Đang cập nhật ${commandPayloads.length} lệnh mới Toàn Cục...`);
      const registered = await rest.put(
        Routes.applicationCommands(config.clientId),
        { body: commandPayloads }
      );
      console.log(`[Deploy] ✅ Đã cập nhật thành công ${registered.length} lệnh mới Toàn Cục: ${commandNames}`);
      console.log('[Deploy] ℹ️ Lưu ý: Lệnh Global có thể mất một vài phút đến 1 giờ để Discord đồng bộ tới tất cả máy chủ.');
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
