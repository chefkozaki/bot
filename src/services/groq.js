const Groq = require('groq-sdk');
const config = require('../config');
const promptManager = require('./promptManager');

class GroqService {
  constructor() {
    this.client = null;
    if (config.groqApiKey) {
      this.client = new Groq({ apiKey: config.groqApiKey });
    }
  }

  /**
   * Đảm bảo client đã được khởi tạo
   */
  ensureClient() {
    if (!this.client && config.groqApiKey) {
      this.client = new Groq({ apiKey: config.groqApiKey });
    }
    if (!this.client) {
      throw new Error('Chưa cấu hình GROQ_API_KEY trong file .env. Vui lòng thêm API Key để sử dụng.');
    }
  }

  /**
   * Gửi câu hỏi đến Groq AI với System Prompt hiện tại được kết hợp
   * @param {string} userMessage - Nội dung câu hỏi của người dùng
   * @param {string} [customSystemPrompt] - Tùy chọn System Prompt nếu cần ghi đè
   * @returns {Promise<string>}
   */
  async ask(userMessage, customSystemPrompt = null) {
    this.ensureClient();

    const systemPrompt = customSystemPrompt || promptManager.getSystemPrompt();

    try {
      const messages = [];

      if (systemPrompt && systemPrompt.trim()) {
        messages.push({
          role: 'system',
          content: systemPrompt.trim(),
        });
      }

      messages.push({
        role: 'user',
        content: userMessage,
      });

      const chatCompletion = await this.client.chat.completions.create({
        messages,
        model: config.groqModel,
      });

      const text = chatCompletion.choices?.[0]?.message?.content;
      if (!text || !text.trim()) {
        return '*(AI đã phản hồi nhưng không có nội dung văn bản)*';
      }

      return text.trim();
    } catch (error) {
      console.error('[GroqService] Lỗi khi gọi Groq API:', error);

      // Xử lý các mã lỗi phổ biến để thông báo rõ ràng cho người dùng
      if (error.status === 401 || error.message?.includes('invalid_api_key')) {
        throw new Error('Groq API Key không hợp lệ. Vui lòng kiểm tra lại cấu hình.');
      }
      if (error.status === 429 || error.message?.includes('rate_limit_exceeded')) {
        throw new Error('Đã vượt quá giới hạn lượt gọi API Groq (Rate limit). Vui lòng thử lại sau ít phút.');
      }
      if (error.status === 404 || error.message?.includes('model_not_found')) {
        throw new Error(`Model \`${config.groqModel}\` không tìm thấy hoặc không được hỗ trợ trên Groq. Hãy kiểm tra biến GROQ_MODEL trong .env.`);
      }

      throw error;
    }
  }
}

const groqService = new GroqService();

module.exports = groqService;
