using System;

namespace MassEmailSender
{
    /// <summary>
    /// Cấu hình email server và sending
    /// </summary>
    public class EmailConfig
    {
        // SMTP Configuration
        public string SmtpHost { get; set; } = "mail.luyenai.vn";
        public int SmtpPort { get; set; } = 587;
        public string SmtpUsername { get; set; } = "noreply";
        public string SmtpPassword { get; set; } = "infore282811";
        public bool EnableSsl { get; set; } = true;
        public int Timeout { get; set; } = 30000; // 30 seconds

        // Email From
        public string FromEmail { get; set; } = "noreply@luyenai.vn";
        public string FromName { get; set; } = "Thầy Hiệu trưởng Luyện AI";

        // Email Subject
        // Nếu UseH1AsSubject = true, subject sẽ được lấy từ thẻ <h1> trong content.txt
        // Nếu không tìm thấy <h1>, sẽ dùng Subject bên dưới
        public bool UseH1AsSubject { get; set; } = true;
        public string Subject { get; set; } = "Thông báo từ Luyện AI";

        // Personalize subject với tên người nhận
        // Ví dụ: "Xin chào {Name}, đây là thông báo quan trọng"
        public bool PersonalizeSubject { get; set; } = true;

        // Rate Limiting (để tránh quá tải server)
        // Với 150k emails, delay 2s = ~83 giờ = ~3.5 ngày
        // Delay 1s = ~41 giờ = ~1.7 ngày
        // Delay 500ms = ~21 giờ
        public int DelayBetweenEmails { get; set; } = 1000; // milliseconds
        public int BatchSize { get; set; } = 100; // Số email gửi trước khi nghỉ dài hơn
        public int DelayBetweenBatches { get; set; } = 5000; // 5 giây giữa các batch

        // Retry Configuration
        public int MaxRetries { get; set; } = 3;
        public int RetryDelay { get; set; } = 5000; // 5 seconds

        // Files
        public string MaillistFile { get; set; } = "maillist.txt";
        public string ContentFile { get; set; } = "content.txt";
        public string LogFile { get; set; } = "send_log.txt";
        public string ErrorLogFile { get; set; } = "error_log.txt";
        public string ProgressFile { get; set; } = "progress.txt";
    }
}
