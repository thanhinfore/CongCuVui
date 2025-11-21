# Mass Email Sender - Luyện AI

Chương trình gửi email hàng loạt với tính năng rate limiting, retry logic, và resume capability.

## Tính năng

- **Rate Limiting**: Delay giữa các email và giữa các batch để tránh quá tải server
- **Retry Logic**: Tự động retry khi gặp lỗi (mặc định 3 lần)
- **Resume Capability**: Tiếp tục gửi từ chỗ bị gián đoạn
- **Progress Tracking**: Theo dõi tiến độ realtime với ước tính thời gian còn lại
- **Error Logging**: Log chi tiết các lỗi phát sinh
- **Template Personalization**: Tự động thay thế {Name} và {Email} trong nội dung email

## Cấu trúc file

```
MassEmailSender/
├── Program.cs              # Main program
├── EmailConfig.cs          # Configuration
├── EmailSender.cs          # Email sending với rate limiting
├── MaillistReader.cs       # Đọc file maillist
├── Logger.cs               # Logging system
├── ProgressTracker.cs      # Tracking progress
├── Recipient.cs            # Model người nhận
├── maillist.txt           # Danh sách người nhận
├── content.txt            # Nội dung HTML email
├── send_log.txt           # Log gửi email (auto-generated)
├── error_log.txt          # Log lỗi (auto-generated)
└── progress.txt           # Progress tracking (auto-generated)
```

## Cách sử dụng

### 1. Chuẩn bị file maillist.txt

Format: `email[TAB]name`

Ví dụ:
```
admin@orm.vn	Lê Công Thành
user1@example.com	Nguyễn Văn A
user2@example.com	Trần Thị B
```

**Lưu ý**: Email và tên phải cách nhau bởi ký tự TAB, không phải space.

### 2. Chuẩn bị file content.txt

Tạo file HTML chứa nội dung email. Bạn có thể sử dụng các placeholder:
- `{Name}` hoặc `{name}`: Sẽ được thay thế bằng tên người nhận
- `{Email}` hoặc `{email}`: Sẽ được thay thế bằng email người nhận

Ví dụ:
```html
<!DOCTYPE html>
<html>
<body>
    <h1>Xin chào {Name}</h1>
    <p>Email này được gửi đến: {Email}</p>
</body>
</html>
```

### 3. Cấu hình (trong EmailConfig.cs)

```csharp
// SMTP Configuration
SmtpHost = "mail.luyenai.vn"
SmtpPort = 587
SmtpUsername = "noreply"
SmtpPassword = "infore282811"

// Email From
FromEmail = "noreply@luyenai.vn"
FromName = "Thầy Hiệu trưởng Luyện AI"

// Subject
Subject = "Thông báo từ Luyện AI"

// Rate Limiting
DelayBetweenEmails = 1000          // 1 giây giữa mỗi email
BatchSize = 100                     // 100 emails mỗi batch
DelayBetweenBatches = 5000         // 5 giây giữa các batch

// Retry
MaxRetries = 3                      // Retry tối đa 3 lần
RetryDelay = 5000                   // 5 giây giữa các retry
```

### 4. Chạy chương trình

```bash
# Build
msbuild MassEmailSender.csproj

# Run
MassEmailSender.exe
```

Hoặc chạy từ Visual Studio (F5).

### 5. Theo dõi tiến độ

Chương trình sẽ hiển thị:
- Configuration
- Số lượng email cần gửi
- Progress realtime với ước tính thời gian còn lại
- Số lượng thành công / lỗi

Các file log:
- `send_log.txt`: Log tất cả các email đã gửi
- `error_log.txt`: Chi tiết lỗi
- `progress.txt`: Danh sách email đã gửi thành công (để resume)

### 6. Resume khi bị gián đoạn

Nếu chương trình bị dừng giữa chừng, chạy lại và chọn "Y" khi được hỏi:
```
Phát hiện 1000 email đã được gửi trước đó.
Bạn có muốn tiếp tục từ chỗ đã dừng không? (Y/N)
```

Chọn "Y" để tiếp tục, "N" để bắt đầu lại từ đầu.

## Ước tính thời gian

Với cấu hình mặc định:
- Delay giữa emails: 1 giây
- Delay giữa batches (100 emails): 5 giây

**Tính toán**:
- 100 emails đầu: ~100 giây (1.7 phút)
- 1,000 emails: ~1,045 giây (~17 phút)
- 10,000 emails: ~10,450 giây (~3 giờ)
- 150,000 emails: ~156,750 giây (~43.5 giờ = ~1.8 ngày)

**Khuyến nghị**:
- Để gửi nhanh hơn, giảm `DelayBetweenEmails` xuống 500ms
- Với 150,000 emails và delay 500ms: ~21.5 giờ

## Lưu ý quan trọng

1. **Test trước**: Test với vài email trước khi gửi hàng loạt
2. **SMTP Limits**: Kiểm tra giới hạn của SMTP server (emails/giờ, emails/ngày)
3. **Backup**: Backup file maillist.txt và content.txt
4. **Monitor**: Theo dõi log để phát hiện lỗi sớm
5. **Network**: Đảm bảo kết nối mạng ổn định
6. **Compliance**: Tuân thủ luật chống spam (CAN-SPAM, GDPR, etc.)

## Xử lý lỗi

Các lỗi thường gặp:

1. **SMTP Authentication Failed**: Kiểm tra username/password
2. **Connection Timeout**: Kiểm tra firewall, SMTP port
3. **Invalid Email**: Kiểm tra format email trong maillist.txt
4. **File Not Found**: Đảm bảo maillist.txt và content.txt tồn tại

Chi tiết lỗi được ghi trong `error_log.txt`.

## Support

Liên hệ: admin@luyenai.vn

## License

© 2024 Luyện AI. All rights reserved.
