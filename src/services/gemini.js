const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');
const promptManager = require('./promptManager');

class GeminiService {
  constructor() {
    this.client = null;
    if (config.geminiApiKey) {
      this.client = new GoogleGenerativeAI(config.geminiApiKey);
    }
  }

  /**
   * Đảm bảo client đã được khởi tạo
   */
  ensureClient() {
    if (!this.client && config.geminiApiKey) {
      this.client = new GoogleGenerativeAI(config.geminiApiKey);
    }
    if (!this.client) {
      throw new Error('Chưa cấu hình GEMINI_API_KEY trong file .env. Vui lòng thêm API Key để sử dụng.');
    }
  }

  /**
   * Gửi câu hỏi đến Google Gemini AI với System Prompt hiện tại được kết hợp
   * @param {string} userMessage - Nội dung câu hỏi của người dùng
   * @param {string} [customSystemPrompt] - Tùy chọn System Prompt nếu cần ghi đè
   * @returns {Promise<string>}
   */
  async ask(userMessage, customSystemPrompt = null) {
    this.ensureClient();

    const systemPrompt = customSystemPrompt || promptManager.getSystemPrompt();

    try {
      // Khởi tạo model với systemInstruction (System Prompt)
      const model = this.client.getGenerativeModel({
        model: config.geminiModel,
        systemInstruction: systemPrompt,
      });

      // Gửi yêu cầu câu hỏi của người dùng
      const result = await model.generateContent(userMessage);
      const response = await result.response;

      // Kiểm tra lý do kết thúc (finishReason) hoặc an toàn
      const candidate = response.candidates?.[0];
      if (candidate?.finishReason === 'SAFETY') {
        return '⚠️ Phản hồi đã bị lọc bởi bộ lọc an toàn của Google AI.';
      }

      const text = response.text();
      if (!text || !text.trim()) {
        return '*(AI đã phản hồi nhưng không có nội dung văn bản)*';
      }

      return text.trim();
    } catch (error) {
      console.error('[GeminiService] Lỗi khi gọi Gemini API:', error);

      // Xử lý các mã lỗi phổ biến để thông báo rõ ràng cho người dùng
      if (error.message?.includes('API_KEY_INVALID') || error.status === 400) {
        throw new Error('Google Gemini API Key không hợp lệ. Vui lòng kiểm tra lại cấu hình.');
      }
      if (error.status === 429 || error.message?.includes('ResourceExhausted')) {
        throw new Error('Đã vượt quá giới hạn lượt gọi API Google Gemini (Rate limit). Vui lòng thử lại sau ít phút.');
      }
      if (error.status === 404 || error.message?.includes('not found')) {
        throw new Error(`Model \`${config.geminiModel}\` không tìm thấy hoặc không được hỗ trợ. Hãy kiểm tra biến GEMINI_MODEL trong .env.`);
      }

      throw error;
    }
  }
}

const geminiService = new GeminiService();

module.exports = geminiService;
