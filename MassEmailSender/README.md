# Mass Email Sender - Luyện AI

Chương trình gửi email hàng loạt với tính năng rate limiting, retry logic, và resume capability.

## Tính năng

- **Rate Limiting**: Delay giữa các email và giữa các batch để tránh quá tải server
- **Retry Logic**: Tự động retry khi gặp lỗi (mặc định 3 lần)
- **Resume Capability**: Tiếp tục gửi từ chỗ bị gián đoạn
- **Progress Tracking**: Theo dõi tiến độ realtime với ước tính thời gian còn lại
- **Error Logging**: Log chi tiết các lỗi phát sinh
- **Template Personalization**: Tự động thay thế {Name} và {Email} trong nội dung email
- **Auto Subject Extraction**: Tự động lấy nội dung thẻ `<h1>` làm subject email
- **Subject Personalization**: Cá nhân hóa subject với tên người nhận (hỗ trợ placeholder {Name})

### 🛡️ Anti-Spam Features (NEW!)

- **Plain Text + HTML**: Gửi cả 2 versions để tăng deliverability score
- **Unique Message-ID**: Mỗi email có Message-ID riêng biệt
- **Reply-To Header**: Thiết lập địa chỉ reply-to chính xác
- **List-Unsubscribe**: RFC 2369 compliant unsubscribe header
- **Randomized Delays**: Delay ngẫu nhiên ±20% để tự nhiên hơn
- **Unsubscribe Link**: Tự động thêm link hủy đăng ký trong email
- **Normal Priority**: Không dùng high priority để tránh spam flag
- **Professional Headers**: X-Mailer và các headers chuẩn

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

**Quan trọng**: Nội dung trong thẻ `<h1>` sẽ tự động được sử dụng làm **subject** của email!

Ví dụ:
```html
<!DOCTYPE html>
<html>
<body>
    <!-- Nội dung trong h1 sẽ là subject: "Xin chào Lê Công Thành, chào mừng đến với Luyện AI" -->
    <h1>Xin chào {Name}, chào mừng đến với Luyện AI</h1>
    <p>Email này được gửi đến: {Email}</p>
</body>
</html>
```

**Personalization trong Subject**:
- Subject sẽ được lấy từ thẻ `<h1>` đầu tiên trong HTML
- Placeholder `{Name}` trong `<h1>` sẽ được thay thế bằng tên thật của người nhận
- Ví dụ: "Xin chào {Name}" → "Xin chào Lê Công Thành"

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
ReplyToEmail = "support@luyenai.vn"  // Địa chỉ reply-to
ReplyToName = "Hỗ trợ Luyện AI"

// Anti-Spam Settings
UnsubscribeUrl = "https://luyenai.vn/unsubscribe?email={Email}"
AddUnsubscribeHeader = true          // Thêm List-Unsubscribe header
IncludePlainTextVersion = true       // Gửi cả plain text version
RandomizeDelays = true               // Randomize delays ±20%

// Subject Configuration
UseH1AsSubject = true               // Tự động lấy subject từ thẻ <h1>
Subject = "Thông báo từ Luyện AI"  // Subject mặc định nếu không có <h1>
PersonalizeSubject = true           // Cá nhân hóa subject với {Name}

// Rate Limiting
DelayBetweenEmails = 1000          // 1 giây giữa mỗi email
BatchSize = 100                     // 100 emails mỗi batch
DelayBetweenBatches = 5000         // 5 giây giữa các batch

// Retry
MaxRetries = 3                      // Retry tối đa 3 lần
RetryDelay = 5000                   // 5 giây giữa các retry
```

**Giải thích Subject Configuration**:
- `UseH1AsSubject = true`: Tự động extract nội dung thẻ `<h1>` làm subject
- `UseH1AsSubject = false`: Dùng `Subject` cố định cho tất cả email
- `PersonalizeSubject = true`: Thay thế `{Name}` trong subject bằng tên người nhận
- `PersonalizeSubject = false`: Giữ nguyên subject, không personalize

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

## Ví dụ Subject Personalization

### Kịch bản 1: Subject với tên người nhận

**File content.txt**:
```html
<h1>Xin chào {Name}, chào mừng đến với Luyện AI</h1>
```

**File maillist.txt**:
```
admin@orm.vn	Lê Công Thành
user1@example.com	Nguyễn Văn A
```

**Kết quả**:
- Email đến admin@orm.vn có subject: "Xin chào Lê Công Thành, chào mừng đến với Luyện AI"
- Email đến user1@example.com có subject: "Xin chào Nguyễn Văn A, chào mừng đến với Luyện AI"

### Kịch bản 2: Subject không có placeholder

**File content.txt**:
```html
<h1>Thông báo quan trọng từ Luyện AI</h1>
```

**Kết quả**: Tất cả email đều có subject: "Thông báo quan trọng từ Luyện AI"

### Kịch bản 3: Không có thẻ <h1>

Nếu không có thẻ `<h1>` trong content.txt, chương trình sẽ sử dụng `Subject` trong `EmailConfig.cs`.

## 🛡️ Anti-Spam Best Practices

Chương trình đã tích hợp nhiều tính năng để tránh spam filter. Dưới đây là những gì đã được implement:

### 1. Email Headers Tự Động

**Message-ID**: Mỗi email có unique Message-ID theo format:
```
<emailhash.timestamp.random@luyenai.vn>
```

**Reply-To**: Email tự động có Reply-To header để người nhận có thể trả lời:
```
Reply-To: Hỗ trợ Luyện AI <support@luyenai.vn>
```

**List-Unsubscribe**: Chuẩn RFC 2369 cho phép người dùng unsubscribe dễ dàng:
```
List-Unsubscribe: <https://luyenai.vn/unsubscribe?email=...>
List-Unsubscribe-Post: List-Unsubscribe=One-Click
```

### 2. Multi-Part Email (Plain Text + HTML)

Email được gửi với CẢ 2 versions:
- **Plain Text**: Convert từ HTML, loại bỏ tags
- **HTML**: Version đẹp với styling

Điều này tăng đáng kể deliverability score!

### 3. Randomized Delays

Thay vì delay cố định (1000ms), delay được randomize ±20%:
- Email 1: 850ms
- Email 2: 1150ms
- Email 3: 920ms

Pattern tự nhiên hơn → không bị detect là bot!

### 4. Unsubscribe Link

Template tự động có unsubscribe link trong footer:
```html
<a href="https://luyenai.vn/unsubscribe?email={Email}">
    hủy đăng ký tại đây
</a>
```

Link này cũng được thêm vào email header (List-Unsubscribe).

### 5. Sender Best Practices

✅ **Đã làm**:
- Consistent From address (noreply@luyenai.vn)
- Valid Reply-To (support@luyenai.vn)
- Normal priority (không dùng High)
- Professional X-Mailer header

⚠️ **BẠN CẦN LÀM** (phía server):
- **SPF Record**: Thêm TXT record cho domain:
  ```
  v=spf1 mx a ip4:YOUR_SERVER_IP ~all
  ```

- **DKIM**: Cấu hình DKIM signing cho mail server

- **DMARC**: Thêm DMARC policy:
  ```
  v=DMARC1; p=quarantine; rua=mailto:postmaster@luyenai.vn
  ```

- **Reverse DNS (PTR)**: Đảm bảo server IP có PTR record đúng

### 6. Content Best Practices

✅ **Nên làm**:
- Có cả text và image (balanced ratio)
- Subject rõ ràng, không spam words ("FREE!!!", "URGENT!!!")
- Có physical address trong footer
- Có unsubscribe link rõ ràng
- Personalize với tên người nhận

❌ **Tránh**:
- ALL CAPS trong subject
- Quá nhiều dấu chấm than (!!!)
- Spam words: "click here", "make money", "free money"
- Quá nhiều links trong 1 email
- Gửi attachments lớn
- Shortlinks (bit.ly, tinyurl)

### 7. Warm-up Email Server

Khi gửi lần đầu với server mới, nên **warm-up**:

**Ngày 1**: 50 emails
**Ngày 2**: 100 emails
**Ngày 3**: 200 emails
**Ngày 4**: 500 emails
**Ngày 5**: 1,000 emails
**Ngày 6+**: Full speed

Điều chỉnh trong code bằng cách giới hạn recipients:
```csharp
// Trong Program.cs, giới hạn số email đầu tiên
List<Recipient> todayRecipients = pendingRecipients.Take(50).ToList();
```

### 8. Monitor Deliverability

Theo dõi các metrics:
- **Bounce Rate**: Nên < 2%
- **Complaint Rate**: Nên < 0.1%
- **Open Rate**: Thường 15-25%
- **Click Rate**: Thường 2-5%

Tools để test:
- [Mail-Tester.com](https://www.mail-tester.com) - Test spam score
- [MXToolbox](https://mxtoolbox.com) - Check DNS records
- [Google Postmaster Tools](https://postmaster.google.com) - Monitor Gmail deliverability

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
