using System;
using System.IO;
using System.Net;
using System.Net.Mail;
using System.Text;
using System.Text.RegularExpressions;
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
        private string _baseSubject;

        public EmailSender(EmailConfig config, Logger logger)
        {
            _config = config;
            _logger = logger;

            // Đọc HTML content từ file
            LoadHtmlContent();

            // Extract subject từ <h1> nếu được cấu hình
            ExtractBaseSubject();
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
        /// Extract base subject từ <h1> hoặc sử dụng default
        /// </summary>
        private void ExtractBaseSubject()
        {
            if (_config.UseH1AsSubject)
            {
                string h1Content = ExtractH1Content(_htmlContent);
                if (!string.IsNullOrWhiteSpace(h1Content))
                {
                    _baseSubject = h1Content;
                    _logger.Log($"Sử dụng subject từ thẻ <h1>: {_baseSubject}");
                }
                else
                {
                    _baseSubject = _config.Subject;
                    _logger.Log($"Không tìm thấy thẻ <h1>, sử dụng subject mặc định: {_baseSubject}");
                }
            }
            else
            {
                _baseSubject = _config.Subject;
                _logger.Log($"Sử dụng subject mặc định: {_baseSubject}");
            }
        }

        /// <summary>
        /// Extract nội dung từ thẻ <h1> trong HTML
        /// </summary>
        private string ExtractH1Content(string html)
        {
            try
            {
                // Regex để tìm nội dung trong thẻ <h1>...</h1>
                // Hỗ trợ cả <h1 style="...">content</h1>
                Match match = Regex.Match(html, @"<h1[^>]*>(.*?)</h1>", RegexOptions.IgnoreCase | RegexOptions.Singleline);

                if (match.Success)
                {
                    string content = match.Groups[1].Value;

                    // Remove HTML tags bên trong (nếu có)
                    content = Regex.Replace(content, @"<[^>]+>", "");

                    // Decode HTML entities
                    content = System.Net.WebUtility.HtmlDecode(content);

                    // Trim whitespace
                    content = content.Trim();

                    return content;
                }
            }
            catch (Exception ex)
            {
                _logger.Log($"Lỗi khi extract <h1>: {ex.Message}");
            }

            return null;
        }

        /// <summary>
        /// Personalize subject với thông tin người nhận
        /// </summary>
        private string PersonalizeSubject(Recipient recipient)
        {
            if (!_config.PersonalizeSubject)
            {
                return _baseSubject;
            }

            string subject = _baseSubject;

            // Thay thế các placeholder
            subject = subject.Replace("{Name}", recipient.Name);
            subject = subject.Replace("{name}", recipient.Name);
            subject = subject.Replace("{Email}", recipient.Email);
            subject = subject.Replace("{email}", recipient.Email);

            return subject;
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
                    // Personalize content và subject
                    string personalizedContent = PersonalizeContent(recipient);
                    string personalizedSubject = PersonalizeSubject(recipient);

                    // Tạo email message
                    MailMessage msg = new MailMessage();
                    msg.To.Add(recipient.Email);
                    msg.From = new MailAddress(_config.FromEmail, _config.FromName);
                    msg.Subject = personalizedSubject;
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
