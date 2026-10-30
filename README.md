# 🤖 Discord Groq AI Bot (Node.js & Discord.js v14)

Bot Discord thông minh được xây dựng bằng **Node.js** và thư viện **Discord.js v14**, tích hợp trực tiếp **Groq AI API (Llama 3.3, Llama 3.1,...)** siêu nhanh để trả lời câu hỏi của người dùng khi được ping (`@mention`), đồng thời hỗ trợ quản lý và lưu trữ **System Prompt** động qua Slash Commands với phân quyền Role, quản lý bật/tắt bot theo kênh (`/disable`, `/enable`) và tùy chọn tắt phản hồi khi reply bot.

---

## 🌟 Tính Năng Nổi Bật

1. **Hỏi đáp với AI khi Ping Bot:**
   - Khi người dùng ping trực tiếp Bot (`@Bot <câu hỏi>`), Bot sẽ kích hoạt trạng thái gõ phím (*typing indicator*) và gọi Groq API với tốc độ cực nhanh để trả lời.
   - **Tất cả câu hỏi trước khi gửi đến AI đều được tự động kết hợp với System Prompt** (được gửi dưới dạng message `system` chuẩn của OpenAI/Groq API).
   - Tự động chia nhỏ tin nhắn nếu phản hồi dài vượt quá 2000 ký tự (chuẩn Discord) và giữ nguyên định dạng Markdown/khối code (` ``` `).
   - Tự động bỏ qua các tin nhắn ping `@everyone` hoặc `@here` để tránh phản hồi không mong muốn khi có thông báo toàn server.

2. **Tắt phản hồi khi Reply tin nhắn của Bot:**
   - Khi người dùng click reply vào tin nhắn của bot, bot sẽ **tự động bỏ qua và không trả lời**, tránh việc spam hoặc chen ngang khi người dùng chỉ muốn trích dẫn lại câu trả lời cũ của bot.
   - Tính năng có thể bật/tắt linh hoạt qua biến môi trường `IGNORE_BOT_REPLIES=true` trong file `.env`.

3. **Quản lý bật/tắt Bot theo kênh (`/disable` & `/enable`):**
   - `/disable [kenh]`: Tắt bot ở một kênh cụ thể (hoặc kênh hiện tại nếu để trống). Khi bị tắt, bot sẽ không phản hồi bất kỳ tin nhắn hoặc ping nào tại kênh đó (kể cả các thread thuộc kênh).
   - `/enable [kenh]`: Bật lại bot ở kênh đã bị tắt (hoặc kênh hiện tại).
   - Danh sách các kênh bị tắt được lưu bền vững vào `data/disabled_channels.json`.
   - Yêu cầu người dùng có Role được chỉ định (`ALLOWED_ROLE_ID`) hoặc quyền **Administrator** trên máy chủ.

4. **Lệnh Điều Hành & Kỷ Luật (Moderation) qua Turso Database:**
   - ⚠️ `/warn <username> <reason>`: Cảnh cáo thành viên và gửi tin nhắn riêng (DM) cảnh báo.
   - 🔇 `/mute <username> <time> <reason>`: Tắt tiếng (Timeout) thành viên với thời hạn linh hoạt (`10m`, `1h`, `2d`, `7d`,...).
   - 👢 `/kick <username> <reason>`: Trục xuất thành viên khỏi máy chủ.
   - 🔨 `/ban <username> <reason>`: Cấm thành viên khỏi máy chủ.
   - **Thông báo ngay lập tức sau khi thực hiện:**
     - Người bị xử lý (`@mention` + tag + ID)
     - Người xử lý (`@mention` + tag)
     - Lý do xử lý
     - **Số lần bị xử lý cùng kiểu:** Thông báo chính xác đây là lần thứ mấy thành viên bị warn/mute/kick/ban trên server.
   - **Tra cứu lịch sử kỷ luật (Moderation Lists):**
     - `/warnlist [username]`: Hiển thị danh sách các thành viên bị warn, số lần và lý do.
     - `/mutelist [username]`: Danh sách các thành viên bị mute.
     - `/kicklist [username]`: Danh sách các thành viên bị kick.
     - `/banlist [username]`: Danh sách các thành viên bị ban.
     - *(Nếu để trống `username`: xem danh sách tổng hợp toàn server; Nếu chọn `username`: xem lịch sử chi tiết từng lần của thành viên đó)*.
   - **Lưu trữ qua Turso Database:** Tất cả dữ liệu kỷ luật được lưu trữ trên Turso Cloud Database (`@libsql/client`) hoặc tự động fallback sang SQLite cục bộ nếu chưa cấu hình URL.
   - **Bảo vệ thứ bậc Role (Hierarchy Check):** Tự động chặn việc xử lý người có Role cao hơn hoặc bằng bản thân / Bot, ngăn ngừa lỗi quyền hạn.

5. **Lệnh Quản Lý System Prompt:**
   - `/getsys`: Hiển thị System Prompt hiện tại, model Groq đang dùng, trạng thái reply và danh sách các kênh đang bị tắt bot dưới dạng Embed. Có tùy chọn xem ẩn danh (`an_danh: true`).
   - `/changesys`: Thay đổi System Prompt. **Chỉ người dùng có Role được chỉ định (hoặc quản trị viên Administrator) mới được sử dụng.**
     - Nhập nhanh qua tham số: `/changesys prompt: "Nội dung prompt mới..."`
     - Hoặc gõ `/changesys` (không điền tham số) để mở **Bảng soạn thảo đa dòng (Modal)** với nội dung prompt hiện tại được điền sẵn để dễ dàng chỉnh sửa.
     - Tùy chọn khôi phục về prompt ban đầu (`reset_mac_dinh: true`).

6. **Changelog và thông báo khởi động:**
   - `/changelog`: Hiển thị toàn bộ nội dung `changelog.md` với định dạng Markdown.
   - `/setlog channel:<kênh>`: Thiết lập kênh nhận changelog khi bot khởi động. Lệnh yêu cầu quyền Administrator hoặc role được cấu hình.
   - Cấu hình được lưu theo từng máy chủ trong database Turso (hoặc SQLite local fallback). Nếu phát hiện file JSON cũ, bot tự động chuyển sang database và xoá file đó.

7. **Lưu trữ bền vững (Persistence):**
   - Lịch sử vi phạm Moderation lưu qua **Turso Database** (`@libsql/client`).
   - System Prompt được lưu vào file `data/system_prompt.txt`.
   - Danh sách các kênh bị tắt bot được lưu vào file `data/disabled_channels.json`.
   - Khi Bot khởi động lại, mọi dữ liệu cấu hình đều được giữ nguyên.

---

## 📁 Cấu Trúc Thư Mục

```
.
├── data/
│   ├── system_prompt.txt       # File lưu trữ System Prompt hiện tại
│   ├── disabled_channels.json  # File lưu trữ danh sách kênh đang bị tắt bot
│   └── moderation.db           # SQLite cục bộ dự phòng (khi chưa cấu hình Turso)
├── src/
│   ├── commands/
│   │   ├── ban.js              # Lệnh /ban
│   │   ├── banlist.js          # Lệnh /banlist
│   │   ├── changesys.js        # Lệnh /changesys
│   │   ├── disable.js          # Lệnh /disable (tắt bot tại kênh)
│   │   ├── enable.js           # Lệnh /enable (bật lại bot tại kênh)
│   │   ├── getsys.js           # Lệnh /getsys
│   │   ├── kick.js             # Lệnh /kick
│   │   ├── kicklist.js         # Lệnh /kicklist
│   │   ├── mute.js             # Lệnh /mute (tắt tiếng có thời hạn)
│   │   ├── mutelist.js         # Lệnh /mutelist
│   │   ├── warn.js             # Lệnh /warn (cảnh cáo)
│   │   └── warnlist.js         # Lệnh /warnlist
│   ├── handlers/
│   │   ├── messageCreate.js    # Bắt sự kiện ping bot, lọc reply bot và phản hồi AI
│   │   └── interactionCreate.js# Tự động nạp và điều hướng Slash commands & Modal form
│   ├── services/
│   │   ├── db.js               # Kết nối Database Turso (@libsql/client) & lưu trữ vi phạm
│   │   ├── groq.js             # Kết nối Groq AI API
│   │   ├── promptManager.js    # Quản lý đọc/ghi và lưu trữ System Prompt
│   │   └── channelManager.js   # Quản lý đọc/ghi danh sách kênh bị tắt
│   ├── utils/
│   │   ├── createListCommand.js# Helper tạo các lệnh xem danh sách vi phạm
│   │   ├── duration.js         # Phân tích cú pháp thời gian (10m, 1h, 1d,...)
│   │   ├── moderationHelper.js # Kiểm tra thứ bậc vai trò (Role Hierarchy)
│   │   ├── permission.js       # Kiểm tra phân quyền Role / Administrator
│   │   └── splitMessage.js     # Chia nhỏ văn bản an toàn khi vượt quá 2000 ký tự
│   ├── config.js               # Đọc và xác thực cấu hình biến môi trường
│   ├── deploy.js               # Reset cache, xoá lệnh cũ và đăng ký Slash Commands
│   └── index.js                # Điểm khởi chạy chính của Bot
├── .env.example                # File mẫu cấu hình biến môi trường
├── .gitignore                  # Bỏ qua node_modules, .env,...
├── package.json
└── README.md
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Bot

### Bước 1: Yêu cầu chuẩn bị
- **Node.js** phiên bản 18 trở lên (đã kiểm tra tương thích tốt trên Node 20, 22 và 24).
- Tài khoản [Groq Console](https://console.groq.com/keys) để lấy Groq API Key miễn phí.
- Tài khoản [Discord Developer Portal](https://discord.com/developers/applications) để tạo Bot.

---

### Bước 2: Thiết lập Discord Bot trên Developer Portal

1. Truy cập [Discord Developer Portal](https://discord.com/developers/applications) và nhấn **New Application**.
2. Đặt tên cho ứng dụng (ví dụ: `Groq AI Assistant`).
3. Vào tab **General Information**: sao chép **Application ID** (đây là `CLIENT_ID`).
4. Vào tab **Bot**:
   - Nhấn **Reset Token** để lấy Bot Token (đây là `DISCORD_TOKEN`).
   - Kéo xuống mục **Privileged Gateway Intents**, BẬT công tắc:
     - ✅ **Message Content Intent** *(BẮT BUỘC để Bot đọc được nội dung khi người dùng ping)*.
     - ✅ **Server Members Intent** *(khuyến nghị bật)*.
5. Vào tab **OAuth2 -> URL Generator**:
   - Trong mục **Scopes**, tick chọn: `bot` và `applications.commands`.
   - Trong mục **Bot Permissions**, tick chọn: `Send Messages`, `Read Message History`, `Embed Links`.
   - Sao chép đường link bên dưới và dán vào trình duyệt để mời Bot vào Server của bạn.

---

### Bước 3: Lấy Groq API Key
1. Truy cập [Groq Console](https://console.groq.com/keys).
2. Đăng nhập hoặc tạo tài khoản miễn phí.
3. Nhấn vào **Create API Key**, đặt tên và sao chép API Key thu được (đây là `GROQ_API_KEY`).

---

### Bước 4: Lấy Role ID trên Discord (cho phân quyền `/changesys`, `/disable`, `/enable`)
1. Trên ứng dụng Discord, vào **Cài đặt người dùng (User Settings)** -> **Nâng cao (Advanced)** -> Bật **Chế độ nhà phát triển (Developer Mode)**.
2. Vào **Cài đặt máy chủ (Server Settings)** -> **Vai trò (Roles)**.
3. Nhấp chuột phải vào Role bạn muốn cấp quyền sử dụng các lệnh quản lý -> Chọn **Sao chép ID vai trò (Copy Role ID)**.
*(Lưu ý: Bất kỳ thành viên nào có quyền Administrator trên server cũng mặc định được phép dùng lệnh).*

---

### Bước 5: Cài đặt mã nguồn và cấu hình

1. Cài đặt các thư viện cần thiết:
   ```bash
   npm install
   ```

2. Tạo file `.env` từ file mẫu `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Mở file `.env` và điền các thông tin đã lấy ở các bước trên:
   ```env
   # Token của Discord Bot
   DISCORD_TOKEN=OTg...your_token_here

   # Client ID của ứng dụng
   CLIENT_ID=123456789012345678

   # (Tùy chọn) Server ID để Slash Commands cập nhật ngay lập tức:
   GUILD_ID=

   # Groq API Key (từ https://console.groq.com/keys)
   GROQ_API_KEY=gsk_...your_groq_key

   # Model Groq sử dụng (mặc định: llama-3.3-70b-versatile hoặc llama-3.1-8b-instant)
   GROQ_MODEL=llama-3.3-70b-versatile

   # ID của Role được phép thay đổi System Prompt và tắt/bật bot theo kênh
   ALLOWED_ROLE_ID=987654321098765432

   # Tùy chọn tên Role dự phòng
   ALLOWED_ROLE_NAME=Bot Manager,Admin

   # Tùy chọn tắt phản hồi khi reply bot (mặc định: true)
   IGNORE_BOT_REPLIES=true
   ```

---

### Bước 6: Đăng ký Slash Commands và Khởi động Bot

1. **Đăng ký Slash Commands lên Discord:**
   ```bash
   npm run deploy
   ```
   *(Nếu bạn có điền `GUILD_ID` trong `.env`, lệnh sẽ xuất hiện ngay lập tức trên Server đó).*

2. **Khởi động Bot:**
   ```bash
   npm start
   ```

   Hoặc chạy ở chế độ phát triển (tự động reload khi sửa code):
   ```bash
   npm run dev
   ```

Khi bot thông báo:
```
✅ Bot đã đăng nhập thành công với tên: BotName#0000
✨ Bot đã sẵn sàng nhận tin nhắn và lệnh!
```
Nghĩa là Bot đã sẵn sàng hoạt động!

---

## 💬 Hướng Dẫn Sử Dụng Bot Trong Discord

### 1. Trò chuyện cùng Bot (Ping @Bot)
Gõ tin nhắn có mention bot ở bất kỳ kênh văn bản nào mà bot có quyền xem:
```
@GroqBot Hãy tóm tắt nội dung cuốn sách Nhà Giả Kim trong 3 gạch đầu dòng.
```
- Bot sẽ hiển thị trạng thái đang soạn tin nhắn (*typing...*).
- Câu hỏi sẽ được kết hợp chặt chẽ với System Prompt hiện tại để tạo câu trả lời đúng định dạng và phong cách mong muốn.
- **Nếu bạn click Reply vào tin nhắn của Bot**, bot sẽ tự động bỏ qua và không trả lời (giữ không gian trò chuyện gọn gàng).

### 2. Tắt bot tại một kênh cụ thể (`/disable`)
*(Yêu cầu Role quản trị hoặc quyền Administrator)*
- **Tắt kênh hiện tại:** `/disable`
- **Tắt một kênh cụ thể:** `/disable kenh: #kenh-can-tat`
- Sau khi tắt, bot sẽ không trả lời tin nhắn hay ping trong kênh đó (và các thread của kênh đó).

### 3. Bật lại bot tại một kênh (`/enable`)
*(Yêu cầu Role quản trị hoặc quyền Administrator)*
- **Bật lại kênh hiện tại:** `/enable`
- **Bật lại kênh cụ thể:** `/enable kenh: #kenh-can-bat`

### 4. Xem System Prompt & Trạng thái Bot (`/getsys`)
- Gõ `/getsys` trong khung chat.
- Bot sẽ trả về Embed hiển thị toàn bộ System Prompt hiện hành, model AI đang dùng, trạng thái bỏ qua reply bot và danh sách tất cả các kênh đang bị tắt bot.

### 5. Thay đổi System Prompt (`/changesys`)
*(Yêu cầu người dùng có Role quy định trong `ALLOWED_ROLE_ID` hoặc quyền Administrator).*
- **Cách 1 (Mở bảng soạn thảo Modal):**
  Chỉ cần gõ `/changesys` và Enter. Một hộp thoại popup sẽ xuất hiện với khung soạn thảo văn bản nhiều dòng và nội dung prompt hiện tại đã được điền sẵn, giúp bạn dễ dàng bổ sung hoặc chỉnh sửa.
- **Cách 2 (Nhập nhanh):**
  `/changesys prompt: Bạn là một chuyên gia lập trình JavaScript, luôn giải thích ngắn gọn kèm code mẫu.`
- **Cách 3 (Khôi phục mặc định):**
  `/changesys reset_mac_dinh: True`

---

## 🛠️ Xử Lý Sự Cố Thường Gặp

| Vấn đề | Nguyên nhân & Cách khắc phục |
|---|---|
| Bot không phản hồi khi ping | Kiểm tra xem đã bật **Message Content Intent** trong tab Bot trên Discord Developer Portal chưa, hoặc kiểm tra xem kênh có đang bị `/disable` không (dùng `/getsys` để xem). |
| Bot không phản hồi khi reply tin nhắn | Đây là tính năng mặc định để tránh spam. Bạn có thể đặt `IGNORE_BOT_REPLIES=false` trong file `.env` nếu muốn bot phản hồi khi reply. |
| Báo lỗi `Missing Access` khi đăng ký lệnh | Kiểm tra lại `CLIENT_ID` trong file `.env` đã đúng với Application ID chưa. |
| Báo lỗi `Groq API Key không hợp lệ` | Kiểm tra lại `GROQ_API_KEY` đã được sao chép chính xác từ https://console.groq.com/keys chưa. |
| Người dùng có role nhưng bị báo từ chối quyền `/disable` hoặc `/changesys` | Đảm bảo bạn đã sao chép đúng ID dạng số của Role (ví dụ: `123456789...`) vào biến `ALLOWED_ROLE_ID` trong file `.env`. |
