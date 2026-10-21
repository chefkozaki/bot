const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const config = {
  // Discord credentials
  discordToken: process.env.DISCORD_TOKEN || '',
  clientId: process.env.CLIENT_ID || '',
  guildId: process.env.GUILD_ID || '',

  // Gemini credentials
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',

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

  // Validation
  validate() {
    const missing = [];
    if (!this.discordToken) missing.push('DISCORD_TOKEN');
    if (!this.geminiApiKey) missing.push('GEMINI_API_KEY');

    if (missing.length > 0) {
      console.warn(
        `[CẢNH BÁO] Thiếu các biến môi trường bắt buộc: ${missing.join(', ')}.\n` +
        `Vui lòng tạo file .env dựa trên .env.example để bot có thể hoạt động đầy đủ.`
      );
    }
  },
};

module.exports = config;
