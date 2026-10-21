/**
 * Chia nhỏ văn bản dài thành các đoạn nhỏ hơn hoặc bằng maxLength (mặc định 1900 ký tự)
 * để tránh vượt quá giới hạn 2000 ký tự của tin nhắn Discord.
 * Tự động bảo toàn các khối mã (markdown code blocks) nếu bị cắt ngang.
 * 
 * @param {string} text - Văn bản cần chia nhỏ
 * @param {object} [options]
 * @param {number} [options.maxLength=1900] - Chiều dài tối đa cho mỗi đoạn
 * @returns {string[]} Mảng các đoạn tin nhắn
 */
function splitMessage(text, { maxLength = 1900 } = {}) {
  if (!text || typeof text !== 'string') return [];
  if (text.length <= maxLength) return [text];

  const chunks = [];
  let remaining = text;
  let currentCodeBlock = null;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }

    // Xác định điểm cắt tốt nhất trong phạm vi maxLength
    let cutIndex = -1;

    // Ưu tiên 1: Ngắt ở xuống dòng kép (hết đoạn)
    const doubleNewline = remaining.lastIndexOf('\n\n', maxLength);
    if (doubleNewline > maxLength * 0.4) {
      cutIndex = doubleNewline + 2;
    } else {
      // Ưu tiên 2: Ngắt ở xuống dòng đơn
      const singleNewline = remaining.lastIndexOf('\n', maxLength);
      if (singleNewline > maxLength * 0.4) {
        cutIndex = singleNewline + 1;
      } else {
        // Ưu tiên 3: Ngắt ở khoảng trắng
        const space = remaining.lastIndexOf(' ', maxLength);
        if (space > maxLength * 0.4) {
          cutIndex = space + 1;
        } else {
          // Bắt buộc phải cắt tại maxLength
          cutIndex = maxLength;
        }
      }
    }

    let chunk = remaining.slice(0, cutIndex);
    remaining = remaining.slice(cutIndex);

    // Kiểm tra và xử lý khối mã Markdown (```)
    const codeBlockMatches = chunk.match(/```([a-zA-Z0-9_-]*)/g);
    if (codeBlockMatches) {
      const codeBlockCount = (chunk.match(/```/g) || []).length;
      // Nếu số lượng ``` là số lẻ nghĩa là khối mã bị mở dở
      if (codeBlockCount % 2 !== 0) {
        // Tìm ngôn ngữ của khối mã mở gần nhất
        const lastMatch = codeBlockMatches[codeBlockMatches.length - 1];
        const lang = lastMatch.replace('```', '').trim();
        chunk += '\n```';
        remaining = '```' + lang + '\n' + remaining;
      }
    }

    chunks.push(chunk);
  }

  return chunks;
}

module.exports = { splitMessage };
