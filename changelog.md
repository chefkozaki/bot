# Changelog

Tất cả thay đổi đáng chú ý của bot được ghi lại trong tài liệu này.

## Phiên bản hiện tại

### Đã thêm
- Thêm lệnh `/changelog` để xem toàn bộ nội dung changelog bằng định dạng Markdown.
- Thêm lệnh `/setlog <channel>` để thiết lập kênh nhận changelog khi bot khởi động.
- Bot tự động gửi nội dung changelog vào kênh đã thiết lập cho mỗi máy chủ mỗi khi khởi động.

### Quản lý
- Lưu cấu hình kênh changelog theo từng máy chủ trong thư mục `data`.
- Chỉ người có quyền quản trị hoặc role được cấu hình mới có thể dùng `/setlog`.
