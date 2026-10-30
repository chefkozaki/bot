const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const config = {
  // Discord credentials
  discordToken: process.env.DISCORD_TOKEN || '',
  clientId: process.env.CLIENT_ID || '',
  guildId: process.env.GUILD_ID || '',

  // Groq credentials
  groqApiKey: process.env.GROQ_API_KEY || '',
  groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',

  // Turso credentials
  tursoDatabaseUrl: process.env.TURSO_DATABASE_URL || '',
  tursoAuthToken: process.env.TURSO_AUTH_TOKEN || '',

  // Role permissions for /changesys
  allowedRoleIds: (process.env.ALLOWED_ROLE_ID || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean),

  allowedRoleNames: (process.env.ALLOWED_ROLE_NAME || '')
    .split(',')
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean),

  // File paths
  dataDir: path.resolve(__dirname, '../data'),
  systemPromptFile: path.resolve(__dirname, '../data/system_prompt.txt'),
  disabledChannelsFile: path.resolve(__dirname, '../data/disabled_channels.json'),
  changelogChannelsFile: path.resolve(__dirname, '../data/changelog_channels.json'),
  changelogFile: path.resolve(__dirname, '../changelog.md'),

  // Reply settings
  // true: bỏ qua không trả lời khi user reply tin nhắn của bot
  // false: vẫn trả lời bình thường khi reply
  ignoreBotReplies: process.env.IGNORE_BOT_REPLIES !== 'false',

  // Validation
  validate() {
    const missing = [];
    if (!this.discordToken) missing.push('DISCORD_TOKEN');
    if (!this.groqApiKey) missing.push('GROQ_API_KEY');

    if (missing.length > 0) {
      console.warn(
        `[CẢNH BÁO] Thiếu các biến môi trường bắt buộc: ${missing.join(', ')}.\n` +
        `Vui lòng tạo file .env dựa trên .env.example để bot có thể hoạt động đầy đủ.`
      );
    }
  },
};

module.exports = config;
