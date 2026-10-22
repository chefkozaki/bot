const groqService = require('../services/groq');
const promptManager = require('../services/promptManager');
const channelManager = require('../services/channelManager');
const config = require('../config');
const { splitMessage } = require('../utils/splitMessage');

/**
 * Xử lý sự kiện khi có tin nhắn mới trên Discord
 * @param {import('discord.js').Message} message
 * @param {import('discord.js').Client} client
 */
async function handleMessageCreate(message, client) {
  // Bỏ qua tin nhắn từ bot hoặc webhook
  if (message.author.bot) return;

  // 1. Kiểm tra xem kênh hoặc kênh cha (nếu là thread) có bị tắt bot hay không (/disable)
  const isChannelDisabled =
    channelManager.isChannelDisabled(message.channelId) ||
    (message.channel.isThread?.() && channelManager.isChannelDisabled(message.channel.parentId));

  if (isChannelDisabled) return;

  // 2. Tính năng tắt trả lời khi người dùng reply tin nhắn của bot
  if (config.ignoreBotReplies && message.reference && message.reference.messageId) {
    let isReplyToBot = false;

    // Kiểm tra nhanh qua thuộc tính repliedUser trong mentions
    if (message.mentions.repliedUser && message.mentions.repliedUser.id === client.user.id) {
      isReplyToBot = true;
    } else {
      // Nếu không có trong repliedUser, kiểm tra cache hoặc fetch tin nhắn gốc
      try {
        const referencedMessage =
          message.channel.messages.cache.get(message.reference.messageId) ||
          (await message.channel.messages.fetch(message.reference.messageId).catch(() => null));

        if (referencedMessage && referencedMessage.author.id === client.user.id) {
          isReplyToBot = true;
        }
      } catch (err) {
        // Bỏ qua nếu tin nhắn gốc đã bị xóa hoặc không fetch được
      }
    }

    if (isReplyToBot) {
      console.log(`[Chat] Bỏ qua tin nhắn reply đến bot từ ${message.author.tag}`);
      return;
    }
  }

  // 3. Kiểm tra xem bot có được mention trực tiếp không (không tính @everyone hoặc @here)
  const isBotMentioned = message.mentions.users.has(client.user.id);
  if (!isBotMentioned) return;

  // Loại bỏ tag mention <@ID> hoặc <@!ID> khỏi nội dung tin nhắn để lấy câu hỏi thực tế
  const mentionRegex = new RegExp(`<@!?${client.user.id}>`, 'g');
  const userPrompt = message.content.replace(mentionRegex, '').trim();

  // Nếu người dùng chỉ ping bot mà không có nội dung câu hỏi
  if (!userPrompt) {
    return message.reply({
      content: `👋 Xin chào ${message.author}! Bạn vừa gọi tôi. Hãy đặt câu hỏi kèm theo để tôi có thể hỗ trợ bạn nhé!`,
      allowedMentions: { repliedUser: false },
    });
  }

  // Bắt đầu trạng thái "đang soạn tin..." (typing indicator)
  let typingInterval = null;
  try {
    await message.channel.sendTyping();
    typingInterval = setInterval(() => {
      message.channel.sendTyping().catch(() => {});
    }, 4500);

    const activeSystemPrompt = promptManager.getSystemPrompt();
    console.log(
      `[Chat] Nhận câu hỏi từ ${message.author.tag}: "${userPrompt.slice(0, 60)}..." ` +
      `| Đang kết hợp với System Prompt (${activeSystemPrompt.length} ký tự)`
    );

    // Gửi câu hỏi đến Groq AI kết hợp với System Prompt
    const aiResponse = await groqService.ask(userPrompt);

    // Chia nhỏ phản hồi nếu dài quá giới hạn 2000 ký tự của Discord
    const messageChunks = splitMessage(aiResponse, { maxLength: 1900 });

    for (let i = 0; i < messageChunks.length; i++) {
      if (i === 0) {
        await message.reply({
          content: messageChunks[i],
          allowedMentions: { repliedUser: false },
        });
      } else {
        await message.channel.send({
          content: messageChunks[i],
          allowedMentions: { repliedUser: false },
        });
      }
    }
  } catch (error) {
    console.error(`[Chat] Lỗi khi xử lý phản hồi cho ${message.author.tag}:`, error);

    const errorMessage = error.message || 'Đã có lỗi nội bộ xảy ra khi tạo câu trả lời.';
    await message.reply({
      content: `⚠️ **Không thể tạo câu trả lời:** ${errorMessage}`,
      allowedMentions: { repliedUser: false },
    });
  } finally {
    if (typingInterval) {
      clearInterval(typingInterval);
    }
  }
}

module.exports = { handleMessageCreate };
