# 🤖 Discord Gemini AI Bot (Node.js & Discord.js v14)

Bot Discord thông minh được xây dựng bằng **Node.js** và thư viện **Discord.js v14**, tích hợp trực tiếp **Google Gemini AI API** để trả lời câu hỏi của người dùng khi được ping (`@mention`), đồng thời hỗ trợ quản lý và lưu trữ **System Prompt** động qua Slash Commands với phân quyền Role.

---

## 🌟 Tính Năng Nổi Bật

1. **Hỏi đáp với AI khi Ping Bot:**
   - Khi người dùng ping trực tiếp Bot (`@Bot <câu hỏi>`), Bot sẽ kích hoạt trạng thái gõ phím (*typing indicator*) và gọi Google Gemini API để trả lời.
   - **Tất cả câu hỏi trước khi gửi đến AI đều được tự động kết hợp với System Prompt** (thông qua cơ chế `systemInstruction` chuẩn của Google Gemini).
   - Tự động chia nhỏ tin nhắn nếu phản hồi dài vượt quá 2000 ký tự (chuẩn Discord) và giữ nguyên định dạng Markdown/khối code (` ``` `).

2. **Lệnh Quản Lý System Prompt:**
   - `/getsys`: Hiển thị System Prompt hiện tại, model đang dùng và thời gian cập nhật gần nhất dưới dạng Embed đẹp mắt. Có tùy chọn xem ẩn danh (`an_danh: true`).
   - `/changesys`: Thay đổi System Prompt. **Chỉ người dùng có Role được chỉ định (hoặc quản trị viên Administrator) mới được sử dụng.**
     - Nhập nhanh qua tham số: `/changesys prompt: "Nội dung prompt mới..."`
     - Hoặc gõ `/changesys` (không điền tham số) để mở **Bảng soạn thảo đa dòng (Modal)** với nội dung prompt hiện tại được điền sẵn để dễ dàng chỉnh sửa.
     - Tùy chọn khôi phục về prompt ban đầu (`reset_mac_dinh: true`).

3. **Lưu trữ bền vững (Persistence):**
   - System Prompt được lưu vào file `data/system_prompt.txt`. Khi Bot khởi động lại, System Prompt vẫn được giữ nguyên mà không bị mất.

---

## 📁 Cấu Trúc Thư Mục

```
.
├── data/
│   └── system_prompt.txt       # File lưu trữ System Prompt hiện tại
├── src/
│   ├── commands/
│   │   ├── getsys.js           # Xử lý lệnh /getsys
│   │   └── changesys.js        # Xử lý lệnh /changesys & kiểm tra phân quyền Role
│   ├── handlers/
│   │   ├── messageCreate.js    # Bắt sự kiện ping bot và phản hồi AI
│   │   └── interactionCreate.js# Điều hướng Slash commands & Modal form
│   ├── services/
│   │   ├── gemini.js           # Kết nối Google Generative AI (Gemini)
│   │   └── promptManager.js    # Quản lý đọc/ghi và lưu trữ System Prompt
│   ├── utils/
│   │   └── splitMessage.js     # Chia nhỏ văn bản an toàn khi vượt quá 2000 ký tự
│   ├── config.js               # Đọc và xác thực cấu hình biến môi trường
│   ├── deploy.js               # Đăng ký Slash Commands với Discord API
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
- Tài khoản [Google AI Studio](https://aistudio.google.com/) để lấy Gemini API Key miễn phí.
- Tài khoản [Discord Developer Portal](https://discord.com/developers/applications) để tạo Bot.

---

### Bước 2: Thiết lập Discord Bot trên Developer Portal

1. Truy cập [Discord Developer Portal](https://discord.com/developers/applications) và nhấn **New Application**.
2. Đặt tên cho ứng dụng (ví dụ: `Gemini Assistant`).
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

### Bước 3: Lấy Google Gemini API Key
1. Truy cập [Google AI Studio](https://aistudio.google.com/).
2. Nhấn vào **Get API key** -> **Create API key**.
3. Sao chép API Key thu được (đây là `GEMINI_API_KEY`).

---

### Bước 4: Lấy Role ID trên Discord (cho phân quyền `/changesys`)
1. Trên ứng dụng Discord, vào **Cài đặt người dùng (User Settings)** -> **Nâng cao (Advanced)** -> Bật **Chế độ nhà phát triển (Developer Mode)**.
2. Vào **Cài đặt máy chủ (Server Settings)** -> **Vai trò (Roles)**.
3. Nhấp chuột phải vào Role bạn muốn cấp quyền sử dụng lệnh `/changesys` -> Chọn **Sao chép ID vai trò (Copy Role ID)**.
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

   # Google Gemini API Key
   GEMINI_API_KEY=AIzaSy...your_gemini_key

   # Model Gemini sử dụng (mặc định: gemini-2.5-flash hoặc gemini-1.5-flash)
   GEMINI_MODEL=gemini-2.5-flash

   # ID của Role được phép thay đổi System Prompt
   ALLOWED_ROLE_ID=987654321098765432

   # Tùy chọn tên Role dự phòng
   ALLOWED_ROLE_NAME=Bot Manager,Admin
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
@GeminiBot Hãy tóm tắt nội dung cuốn sách Nhà Giả Kim trong 3 gạch đầu dòng.
```
- Bot sẽ hiển thị trạng thái đang soạn tin nhắn (*typing...*).
- Câu hỏi sẽ được kết hợp chặt chẽ với System Prompt hiện tại để tạo câu trả lời đúng định dạng và phong cách mong muốn.

### 2. Xem System Prompt hiện tại (`/getsys`)
- Gõ `/getsys` trong khung chat.
- Bot sẽ trả về Embed hiển thị toàn bộ System Prompt hiện hành cùng thông tin ngày giờ cập nhật và Model AI đang dùng.

### 3. Thay đổi System Prompt (`/changesys`)
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
| Bot không phản hồi khi ping | Kiểm tra xem đã bật **Message Content Intent** trong tab Bot trên Discord Developer Portal chưa. |
| Báo lỗi `Missing Access` khi đăng ký lệnh | Kiểm tra lại `CLIENT_ID` trong file `.env` đã đúng với Application ID chưa. |
| Báo lỗi `API_KEY_INVALID` từ Gemini | Kiểm tra lại `GEMINI_API_KEY` đã được sao chép chính xác từ Google AI Studio chưa. |
| Người dùng có role nhưng bị báo từ chối quyền `/changesys` | Đảm bảo bạn đã sao chép đúng ID dạng số của Role (ví dụ: `123456789...`) vào biến `ALLOWED_ROLE_ID` trong file `.env`. |
