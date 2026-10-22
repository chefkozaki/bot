const fs = require('fs');
const config = require('../config');

class ChannelManager {
  constructor() {
    this.disabledChannels = new Set();
    this.filePath = config.disabledChannelsFile;
    this.dataDir = config.dataDir;
  }

  /**
   * Khởi tạo và tải danh sách kênh bị tắt từ file JSON
   */
  async init() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      if (fs.existsSync(this.filePath)) {
        const content = await fs.promises.readFile(this.filePath, 'utf-8');
        if (content.trim()) {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            this.disabledChannels = new Set(parsed);
            console.log(`[ChannelManager] Đã tải ${this.disabledChannels.size} kênh bị tắt từ ${this.filePath}`);
            return;
          }
        }
      }

      // Khởi tạo file rỗng nếu chưa tồn tại
      await this.save();
      console.log(`[ChannelManager] Đã khởi tạo file kênh bị tắt tại ${this.filePath}`);
    } catch (error) {
      console.error('[ChannelManager] Lỗi khi khởi tạo ChannelManager:', error);
    }
  }

  /**
   * Kiểm tra xem kênh có bị tắt bot hay không
   * @param {string} channelId
   * @returns {boolean}
   */
  isChannelDisabled(channelId) {
    if (!channelId) return false;
    return this.disabledChannels.has(channelId);
  }

  /**
   * Tắt bot tại một kênh cụ thể
   * @param {string} channelId
   * @returns {Promise<boolean>}
   */
  async disableChannel(channelId) {
    if (!channelId) return false;
    this.disabledChannels.add(channelId);
    await this.save();
    console.log(`[ChannelManager] Đã tắt bot tại kênh ID: ${channelId}`);
    return true;
  }

  /**
   * Bật lại bot tại một kênh cụ thể
   * @param {string} channelId
   * @returns {Promise<boolean>}
   */
  async enableChannel(channelId) {
    if (!channelId) return false;
    const deleted = this.disabledChannels.delete(channelId);
    if (deleted) {
      await this.save();
      console.log(`[ChannelManager] Đã bật lại bot tại kênh ID: ${channelId}`);
    }
    return deleted;
  }

  /**
   * Lấy danh sách tất cả các ID kênh đang bị tắt
   * @returns {string[]}
   */
  getDisabledChannels() {
    return Array.from(this.disabledChannels);
  }

  /**
   * Lưu danh sách kênh bị tắt vào file
   */
  async save() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    const data = JSON.stringify(Array.from(this.disabledChannels), null, 2);
    await fs.promises.writeFile(this.filePath, data, 'utf-8');
  }
}

// Singleton instance
const channelManager = new ChannelManager();

module.exports = channelManager;
