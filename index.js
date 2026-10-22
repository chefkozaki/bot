const { Client, GatewayIntentBits, Partials, Events, ActivityType } = require('discord.js');
const config = require('./src/config');
const { deployCommands } = require('./src/deploy');
const promptManager = require('./src/services/promptManager');
const { handleMessageCreate } = require('./src/handlers/messageCreate');
const { handleInteractionCreate } = require('./src/handlers/interactionCreate');

async function main() {
  console.log('='.repeat(50));
  console.log('🤖 KHỞI ĐỘNG DISCORD GROQ AI BOT');
  console.log('='.repeat(50));

  // Kiểm tra cấu hình môi trường
  config.validate();

  // Khởi tạo PromptManager (tải từ file lưu trữ)
  await promptManager.init();

  if (!config.discordToken) {
    console.error('❌ KHÔNG THỂ KHỞI ĐỘNG: Thiếu DISCORD_TOKEN trong file .env.');
    console.error('👉 Hãy tạo file .env dựa trên .env.example và điền token của bot.');
    process.exit(1);
  }

  // Khởi tạo Discord Client với các quyền (Intents) cần thiết
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent, // BẮT BUỘC để đọc nội dung tin nhắn khi được ping
      GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Channel, Partials.Message],
  });

  // Sự kiện khi Bot sẵn sàng hoạt động
  client.once(Events.ClientReady, (readyClient) => {
    console.log(`✅ Bot đã đăng nhập thành công với tên: ${readyClient.user.tag}`);
    console.log(`📡 Đang hoạt động trên ${readyClient.guilds.cache.size} máy chủ.`);
    console.log(`🧠 AI Model sử dụng: ${config.groqModel}`);
    console.log(`📝 System Prompt hiện tại:\n"${promptManager.getSystemPrompt().slice(0, 100)}..."`);

    if (config.allowedRoleIds.length > 0) {
      console.log(`🔒 Allowed Role IDs: ${config.allowedRoleIds.join(', ')}`);
    } else if (config.allowedRoleNames.length > 0) {
      console.log(`🔒 Allowed Role Names: ${config.allowedRoleNames.join(', ')}`);
    } else {
      console.log('ℹ️ Chưa cấu hình ALLOWED_ROLE_ID: Mặc định chỉ quản trị viên (Administrator) được dùng /changesys.');
    }

    // Đặt trạng thái hoạt động của Bot
    readyClient.user.setPresence({
      activities: [
        {
          name: 'Ping @ tôi để trò chuyện!',
          type: ActivityType.Custom,
        },
      ],
      status: 'online',
    });

    console.log('✨ Bot đã sẵn sàng nhận tin nhắn và lệnh!');
    console.log('='.repeat(50));
  });

  // Lắng nghe sự kiện tin nhắn mới (Ping bot để hỏi AI)
  client.on(Events.MessageCreate, async (message) => {
    await handleMessageCreate(message, client);
  });

  // Lắng nghe các tương tác Slash Command & Modal
  client.on(Events.InteractionCreate, async (interaction) => {
    await handleInteractionCreate(interaction, client);
  });

  // Xử lý đóng ứng dụng an toàn khi tắt tiến trình (Ctrl+C hoặc kill)
  const shutdown = async (signal) => {
    console.log(`\n[Hệ thống] Nhận tín hiệu ${signal}. Đang tắt Bot an toàn...`);
    try {
      client.destroy();
      console.log('[Hệ thống] Đã ngắt kết nối Discord Client thành công.');
    } finally {
      process.exit(0);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Đăng ký Slash Commands với Discord API
  await deployCommands();

  // Đăng nhập vào Discord
  try {
    await client.login(config.discordToken);
  } catch (error) {
    console.error('❌ Đăng nhập Discord thất bại:', error);
    if (error.code === 'TokenInvalid') {
      console.error('👉 Token trong file .env không hợp lệ hoặc đã bị reset. Vui lòng kiểm tra lại.');
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('❌ Lỗi không xử lý được trong hàm main():', err);
  process.exit(1);
});
