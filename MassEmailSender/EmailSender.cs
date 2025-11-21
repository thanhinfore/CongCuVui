using System;
using System.IO;
using System.Net;
using System.Net.Mail;
using System.Text;
using System.Threading;

namespace MassEmailSender
{
    /// <summary>
    /// Gửi email với rate limiting và retry logic
    /// </summary>
    public class EmailSender
    {
        private EmailConfig _config;
        private Logger _logger;
        private string _htmlContent;

        public EmailSender(EmailConfig config, Logger logger)
        {
            _config = config;
            _logger = logger;

            // Đọc HTML content từ file
            LoadHtmlContent();
        }

        /// <summary>
        /// Đọc HTML content từ file
        /// </summary>
        private void LoadHtmlContent()
        {
            if (!File.Exists(_config.ContentFile))
            {
                throw new FileNotFoundException($"Không tìm thấy file content: {_config.ContentFile}");
            }

            _htmlContent = File.ReadAllText(_config.ContentFile, Encoding.UTF8);

            if (string.IsNullOrWhiteSpace(_htmlContent))
            {
                throw new Exception("File content.txt trống!");
            }

            _logger.Log($"Đã load nội dung email từ {_config.ContentFile} ({_htmlContent.Length} ký tự)");
        }

        /// <summary>
        /// Gửi email cho một người nhận với retry logic
        /// </summary>
        public bool SendEmail(Recipient recipient)
        {
            int retryCount = 0;

            while (retryCount <= _config.MaxRetries)
            {
                try
                {
                    // Personalize content
                    string personalizedContent = PersonalizeContent(recipient);

                    // Tạo email message
                    MailMessage msg = new MailMessage();
                    msg.To.Add(recipient.Email);
                    msg.From = new MailAddress(_config.FromEmail, _config.FromName);
                    msg.Subject = _config.Subject;
                    msg.Body = personalizedContent;
                    msg.IsBodyHtml = true;
                    msg.BodyEncoding = Encoding.UTF8;
                    msg.SubjectEncoding = Encoding.UTF8;

                    // Cấu hình SMTP client
                    NetworkCredential cred = new NetworkCredential(_config.SmtpUsername, _config.SmtpPassword);
                    SmtpClient client = new SmtpClient(_config.SmtpHost, _config.SmtpPort);
                    client.Credentials = cred;
                    client.EnableSsl = _config.EnableSsl;
                    client.Timeout = _config.Timeout;

                    // Gửi email
                    client.Send(msg);

                    // Cleanup
                    msg.Dispose();

                    return true;
                }
                catch (Exception ex)
                {
                    retryCount++;

                    if (retryCount > _config.MaxRetries)
                    {
                        // Đã hết số lần retry
                        _logger.LogError(recipient.Email, recipient.Name, ex);
                        return false;
                    }

                    // Log retry attempt
                    _logger.Log($"Retry {retryCount}/{_config.MaxRetries} for {recipient.Email} - Error: {ex.Message}");

                    // Wait before retry
                    Thread.Sleep(_config.RetryDelay);
                }
            }

            return false;
        }

        /// <summary>
        /// Personalize content bằng cách thay thế {Name} và các placeholder khác
        /// </summary>
        private string PersonalizeContent(Recipient recipient)
        {
            string content = _htmlContent;

            // Thay thế các placeholder
            content = content.Replace("{Name}", recipient.Name);
            content = content.Replace("{Email}", recipient.Email);
            content = content.Replace("{name}", recipient.Name);
            content = content.Replace("{email}", recipient.Email);

            return content;
        }

        /// <summary>
        /// Delay giữa các email để tránh quá tải server
        /// </summary>
        public void DelayBetweenEmails()
        {
            if (_config.DelayBetweenEmails > 0)
            {
                Thread.Sleep(_config.DelayBetweenEmails);
            }
        }

        /// <summary>
        /// Delay dài hơn giữa các batch
        /// </summary>
        public void DelayBetweenBatches()
        {
            if (_config.DelayBetweenBatches > 0)
            {
                _logger.Log($"Nghỉ {_config.DelayBetweenBatches}ms giữa các batch...");
                Thread.Sleep(_config.DelayBetweenBatches);
            }
        }
    }
}
