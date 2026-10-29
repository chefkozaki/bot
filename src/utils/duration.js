/**
 * Chuyển đổi chuỗi thời gian người dùng nhập thành milliseconds và định dạng tiếng Việt.
 * Hỗ trợ các đơn vị: s (giây), m (phút), h (giờ), d (ngày), w (tuần).
 * Ví dụ: "10m", "1h", "2d", "1w", "30s", "1h30m".
 * 
 * @param {string} input
 * @returns {{ ms: number, formatted: string } | null}
 */
function parseDuration(input) {
  if (!input || typeof input !== 'string') return null;
  const str = input.trim().toLowerCase();

  const regex = /(\d+)\s*(w|d|h|m|s)?/g;
  let match;
  let totalMs = 0;
  const parts = [];

  const multipliers = {
    w: 7 * 24 * 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    h: 60 * 60 * 1000,
    m: 60 * 1000,
    s: 1000,
  };

  const labels = {
    w: 'tuần',
    d: 'ngày',
    h: 'giờ',
    m: 'phút',
    s: 'giây',
  };

  let found = false;
  while ((match = regex.exec(str)) !== null) {
    if (match[0] === '') break;
    const value = parseInt(match[1], 10);
    const unit = match[2] || 'm'; // Mặc định là phút nếu chỉ nhập số

    if (multipliers[unit] && !isNaN(value) && value > 0) {
      found = true;
      totalMs += value * multipliers[unit];
      parts.push(`${value} ${labels[unit]}`);
    }
  }

  if (!found || totalMs <= 0) return null;

  return {
    ms: totalMs,
    formatted: parts.join(' '),
  };
}

module.exports = { parseDuration };
