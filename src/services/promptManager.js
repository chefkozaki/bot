const fs = require('fs');
const path = require('path');
const config = require('../config');

const DEFAULT_SYSTEM_PROMPT = 
`Bạn là một trợ lý ảo AI thông minh, thân thiện và hữu ích trên máy chủ Discord.
- Trả lời bằng ngôn ngữ mà người dùng sử dụng (mặc định là Tiếng Việt).
- Giữ câu trả lời súc tích, rõ ràng, chính xác và có định dạng Markdown đẹp mắt (in đậm, danh sách gạch đầu dòng, codeblock nếu có code).
- Luôn giữ thái độ lịch sự, vui vẻ và tôn trọng người dùng.`;

class PromptManager {
  constructor() {
    this.prompt = DEFAULT_SYSTEM_PROMPT;
    this.lastUpdated = new Date();
    this.filePath = config.systemPromptFile;
    this.dataDir = config.dataDir;
  }

  /**
   * Khởi tạo và tải System Prompt từ file, nếu chưa có thì tạo mới với prompt mặc định.
   */
  async init() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      if (fs.existsSync(this.filePath)) {
        const content = await fs.promises.readFile(this.filePath, 'utf-8');
        if (content.trim()) {
          this.prompt = content.trim();
          const stats = await fs.promises.stat(this.filePath);
          this.lastUpdated = stats.mtime;
          console.log(`[PromptManager] Đã tải System Prompt từ ${this.filePath}`);
          return;
        }
      }

      // Nếu file chưa tồn tại hoặc rỗng, ghi prompt mặc định
      await this.setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
      console.log(`[PromptManager] Đã khởi tạo file System Prompt mặc định tại ${this.filePath}`);
    } catch (error) {
      console.error('[PromptManager] Lỗi khi khởi tạo System Prompt:', error);
    }
  }

  /**
   * Lấy System Prompt hiện tại
   * @returns {string}
   */
  getSystemPrompt() {
    return this.prompt;
  }

  /**
   * Cập nhật System Prompt mới và lưu vào file
   * @param {string} newPrompt
   * @returns {Promise<string>}
   */
  async setSystemPrompt(newPrompt) {
    if (!newPrompt || typeof newPrompt !== 'string' || !newPrompt.trim()) {
      throw new Error('System Prompt không được để trống.');
    }

    const trimmedPrompt = newPrompt.trim();
    this.prompt = trimmedPrompt;
    this.lastUpdated = new Date();

    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    await fs.promises.writeFile(this.filePath, trimmedPrompt, 'utf-8');
    console.log('[PromptManager] Đã cập nhật và lưu System Prompt mới.');
    return this.prompt;
  }

  /**
   * Lấy thời gian cập nhật lần cuối
   * @returns {Date}
   */
  getLastUpdated() {
    return this.lastUpdated;
  }

  /**
   * Lấy prompt mặc định
   * @returns {string}
   */
  getDefaultPrompt() {
    return DEFAULT_SYSTEM_PROMPT;
  }
}

// Singleton instance
const promptManager = new PromptManager();

module.exports = promptManager;
