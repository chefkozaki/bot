const fs = require('fs');
const config = require('../config');
const db = require('./db');

class ChangelogManager {
  async init() {
    await db.init();
    await this.migrateLegacyJson();
    const settings = await db.getAllChangelogSettings();
    console.log(`[ChangelogManager] Đã tải ${settings.length} cấu hình kênh changelog từ database`);
  }

  async migrateLegacyJson() {
    const filePath = config.changelogChannelsFile;
    if (!fs.existsSync(filePath)) return;

    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const parsed = content.trim() ? JSON.parse(content) : {};
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        for (const [guildId, channelId] of Object.entries(parsed)) {
          await db.setChangelogChannel(guildId, channelId);
        }
      }
      await fs.promises.unlink(filePath);
      console.log('[ChangelogManager] Đã chuyển cấu hình changelog JSON sang database và xoá file JSON cũ');
    } catch (error) {
      console.error('[ChangelogManager] Không thể chuyển cấu hình changelog JSON sang database:', error.message);
    }
  }

  async setChannel(guildId, channelId) {
    await db.setChangelogChannel(guildId, channelId);
  }

  async getChannel(guildId) {
    return db.getChangelogChannel(guildId);
  }

  async getSettings() {
    const settings = await db.getAllChangelogSettings();
    return Object.fromEntries(settings.map(({ guildId, channelId }) => [guildId, channelId]));
  }

  async getChangelog() {
    try {
      return await fs.promises.readFile(config.changelogFile, 'utf-8');
    } catch (error) {
      if (error.code === 'ENOENT') return null;
      throw error;
    }
  }
}

module.exports = new ChangelogManager();
