const path = require('path');
const fs = require('fs');
const config = require('../config');

let client = null;
let isInitialized = false;

/**
 * Lấy hoặc khởi tạo kết nối LibSQL (Turso hoặc local SQLite)
 */
function getClient() {
  if (client) return client;

  let createClient;
  try {
    createClient = require('@libsql/client').createClient;
  } catch (err) {
    throw new Error(
      'Chưa cài đặt thư viện @libsql/client. Vui lòng chạy lệnh: npm install @libsql/client'
    );
  }

  const url = config.tursoDatabaseUrl;
  const authToken = config.tursoAuthToken;

  if (url && (url.startsWith('libsql://') || url.startsWith('https://') || url.startsWith('http://'))) {
    console.log(`[Database] 🌐 Đang kết nối tới Turso Cloud Database: ${url}`);
    client = createClient({
      url,
      authToken: authToken || undefined,
    });
  } else {
    // Fallback SQLite cục bộ nếu chưa cấu hình Turso Cloud
    if (!fs.existsSync(config.dataDir)) {
      fs.mkdirSync(config.dataDir, { recursive: true });
    }
    const dbPath = path.join(config.dataDir, 'moderation.db');
    console.log(`[Database] 💾 Đang sử dụng cơ sở dữ liệu SQLite cục bộ: ${dbPath}`);
    console.log('[Database] 💡 Gợi ý: Bạn có thể điền TURSO_DATABASE_URL và TURSO_AUTH_TOKEN trong file .env để đồng bộ với Turso Cloud.');
    client = createClient({
      url: `file:${dbPath}`,
    });
  }

  return client;
}

/**
 * Khởi tạo bảng dữ liệu moderation nếu chưa tồn tại
 */
async function init() {
  if (isInitialized) return;

  try {
    const db = getClient();

    // Tạo bảng moderation_logs
    await db.execute(`
      CREATE TABLE IF NOT EXISTS moderation_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        user_tag TEXT NOT NULL,
        moderator_id TEXT NOT NULL,
        moderator_tag TEXT NOT NULL,
        action_type TEXT NOT NULL,
        reason TEXT NOT NULL,
        duration TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tạo chỉ mục (Index) để tối ưu hoá truy vấn
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_mod_guild_user_type 
      ON moderation_logs (guild_id, user_id, action_type);
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_mod_guild_type 
      ON moderation_logs (guild_id, action_type);
    `);

    isInitialized = true;
    console.log('[Database] ✅ Khởi tạo bảng dữ liệu Moderation thành công!');
  } catch (error) {
    console.error('[Database] ❌ Lỗi khi khởi tạo Database:', error.message);
  }
}

/**
 * Ghi nhận một hành vi kỷ luật và trả về tổng số lần đã bị xử lý cùng loại
 * @param {object} params
 * @param {string} params.guildId
 * @param {string} params.userId
 * @param {string} params.userTag
 * @param {string} params.moderatorId
 * @param {string} params.moderatorTag
 * @param {string} params.actionType 'warn' | 'mute' | 'kick' | 'ban'
 * @param {string} params.reason
 * @param {string|null} [params.duration]
 * @returns {Promise<{ count: number, id: number|bigint }>}
 */
async function recordModeration({
  guildId,
  userId,
  userTag,
  moderatorId,
  moderatorTag,
  actionType,
  reason,
  duration = null,
}) {
  const db = getClient();
  if (!isInitialized) await init();

  // 1. Thêm bản ghi mới
  const insertResult = await db.execute({
    sql: `
      INSERT INTO moderation_logs (guild_id, user_id, user_tag, moderator_id, moderator_tag, action_type, reason, duration)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [guildId, userId, userTag, moderatorId, moderatorTag, actionType, reason, duration],
  });

  // 2. Đếm tổng số lần bị xử lý cùng loại của user trên guild này
  const countResult = await db.execute({
    sql: `
      SELECT COUNT(*) AS total
      FROM moderation_logs
      WHERE guild_id = ? AND user_id = ? AND action_type = ?
    `,
    args: [guildId, userId, actionType],
  });

  const count = Number(countResult.rows[0]?.total ?? 1);

  return {
    count,
    id: insertResult.lastInsertRowid,
  };
}

/**
 * Lấy danh sách lịch sử xử lý của một người dùng cụ thể
 * @param {object} params
 * @param {string} params.guildId
 * @param {string} params.userId
 * @param {string} params.actionType
 * @param {number} [params.limit=25]
 * @returns {Promise<Array<object>>}
 */
async function getUserHistory({ guildId, userId, actionType, limit = 25 }) {
  const db = getClient();
  if (!isInitialized) await init();

  const result = await db.execute({
    sql: `
      SELECT id, guild_id, user_id, user_tag, moderator_id, moderator_tag, action_type, reason, duration, created_at
      FROM moderation_logs
      WHERE guild_id = ? AND user_id = ? AND action_type = ?
      ORDER BY id DESC
      LIMIT ?
    `,
    args: [guildId, userId, actionType, limit],
  });

  return result.rows || [];
}

/**
 * Lấy danh sách tổng hợp tất cả các thành viên bị xử lý trên máy chủ
 * @param {object} params
 * @param {string} params.guildId
 * @param {string} params.actionType
 * @param {number} [params.limit=25]
 * @returns {Promise<Array<object>>}
 */
async function getGuildSummary({ guildId, actionType, limit = 25 }) {
  const db = getClient();
  if (!isInitialized) await init();

  const result = await db.execute({
    sql: `
      SELECT 
        user_id, 
        user_tag, 
        COUNT(*) AS total_count, 
        GROUP_CONCAT(reason, ' || ') AS reasons,
        MAX(created_at) AS last_at
      FROM moderation_logs
      WHERE guild_id = ? AND action_type = ?
      GROUP BY user_id, user_tag
      ORDER BY last_at DESC
      LIMIT ?
    `,
    args: [guildId, actionType, limit],
  });

  return result.rows || [];
}

module.exports = {
  init,
  recordModeration,
  getUserHistory,
  getGuildSummary,
};
