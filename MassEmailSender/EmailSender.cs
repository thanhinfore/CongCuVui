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
        private Random _random;

        public EmailSender(EmailConfig config, Logger logger)
        {
            _config = config;
            _logger = logger;
            _random = new Random();

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
        /// Tạo unique Message-ID để tránh spam filter
        /// </summary>
        private string GenerateMessageId(Recipient recipient)
        {
            // Format: <uniqueID.timestamp@domain>
            string timestamp = DateTime.UtcNow.Ticks.ToString();
            string emailHash = Math.Abs(recipient.Email.GetHashCode()).ToString();
            string randomPart = _random.Next(10000, 99999).ToString();
            string domain = _config.FromEmail.Split('@')[1];

            return $"<{emailHash}.{timestamp}.{randomPart}@{domain}>";
        }

        /// <summary>
        /// Convert HTML sang plain text để tăng deliverability
        /// </summary>
        private string ConvertHtmlToPlainText(string html)
        {
            if (string.IsNullOrWhiteSpace(html))
                return string.Empty;

            // Remove script and style elements
            string result = Regex.Replace(html, @"<script[^>]*>[\s\S]*?</script>", "", RegexOptions.IgnoreCase);
            result = Regex.Replace(result, @"<style[^>]*>[\s\S]*?</style>", "", RegexOptions.IgnoreCase);

            // Replace <br> and <p> with newlines
            result = Regex.Replace(result, @"<br\s*/?>", "\n", RegexOptions.IgnoreCase);
            result = Regex.Replace(result, @"</p>", "\n\n", RegexOptions.IgnoreCase);
            result = Regex.Replace(result, @"<h[1-6][^>]*>", "\n\n", RegexOptions.IgnoreCase);
            result = Regex.Replace(result, @"</h[1-6]>", "\n", RegexOptions.IgnoreCase);

            // Replace <a href="url">text</a> with text (url)
            result = Regex.Replace(result, @"<a[^>]*href=[""']([^""']*)[""'][^>]*>(.*?)</a>", "$2 ($1)", RegexOptions.IgnoreCase);

            // Remove all remaining HTML tags
            result = Regex.Replace(result, @"<[^>]+>", "");

            // Decode HTML entities
            result = System.Net.WebUtility.HtmlDecode(result);

            // Clean up whitespace
            result = Regex.Replace(result, @"[ \t]+", " "); // Multiple spaces to single
            result = Regex.Replace(result, @"\n[ \t]+", "\n"); // Remove leading spaces on lines
            result = Regex.Replace(result, @"[ \t]+\n", "\n"); // Remove trailing spaces on lines
            result = Regex.Replace(result, @"\n{3,}", "\n\n"); // Max 2 consecutive newlines

            return result.Trim();
        }

        /// <summary>
        /// Personalize unsubscribe URL
        /// </summary>
        private string PersonalizeUnsubscribeUrl(Recipient recipient)
        {
            string url = _config.UnsubscribeUrl;
            url = url.Replace("{Email}", Uri.EscapeDataString(recipient.Email));
            url = url.Replace("{email}", Uri.EscapeDataString(recipient.Email));
            url = url.Replace("{Name}", Uri.EscapeDataString(recipient.Name));
            url = url.Replace("{name}", Uri.EscapeDataString(recipient.Name));
            return url;
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
                    msg.BodyEncoding = Encoding.UTF8;
                    msg.SubjectEncoding = Encoding.UTF8;

                    // ===== ANTI-SPAM: Thêm Reply-To =====
                    if (!string.IsNullOrWhiteSpace(_config.ReplyToEmail))
                    {
                        msg.ReplyToList.Add(new MailAddress(_config.ReplyToEmail, _config.ReplyToName));
                    }

                    // ===== ANTI-SPAM: Thêm Plain Text Version =====
                    if (_config.IncludePlainTextVersion)
                    {
                        // Tạo AlternateView cho plain text và HTML
                        string plainText = ConvertHtmlToPlainText(personalizedContent);
                        AlternateView plainView = AlternateView.CreateAlternateViewFromString(plainText, Encoding.UTF8, "text/plain");
                        AlternateView htmlView = AlternateView.CreateAlternateViewFromString(personalizedContent, Encoding.UTF8, "text/html");

                        msg.AlternateViews.Add(plainView);
                        msg.AlternateViews.Add(htmlView);
                    }
                    else
                    {
                        // Chỉ dùng HTML
                        msg.Body = personalizedContent;
                        msg.IsBodyHtml = true;
                    }

                    // ===== ANTI-SPAM: Custom Headers =====
                    // Unique Message-ID
                    msg.Headers.Add("Message-ID", GenerateMessageId(recipient));

                    // List-Unsubscribe header (chuẩn RFC 2369)
                    if (_config.AddUnsubscribeHeader && !string.IsNullOrWhiteSpace(_config.UnsubscribeUrl))
                    {
                        string unsubUrl = PersonalizeUnsubscribeUrl(recipient);
                        msg.Headers.Add("List-Unsubscribe", $"<{unsubUrl}>");
                        msg.Headers.Add("List-Unsubscribe-Post", "List-Unsubscribe=One-Click");
                    }

                    // X-Mailer (optional - một số spam filter kiểm tra)
                    msg.Headers.Add("X-Mailer", "LuyenAI-EmailSender/1.0");

                    // Priority: Normal (không dùng High để tránh spam flag)
                    msg.Priority = MailPriority.Normal;

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
        /// ANTI-SPAM: Randomize delay để pattern tự nhiên hơn
        /// </summary>
        public void DelayBetweenEmails()
        {
            if (_config.DelayBetweenEmails > 0)
            {
                int delay = _config.DelayBetweenEmails;

                // Randomize delay: ±20% để tự nhiên hơn
                if (_config.RandomizeDelays)
                {
                    int variance = (int)(delay * 0.2); // 20% variance
                    int randomOffset = _random.Next(-variance, variance + 1);
                    delay = delay + randomOffset;

                    // Đảm bảo delay >= 500ms (minimum an toàn)
                    delay = Math.Max(500, delay);
                }

                Thread.Sleep(delay);
            }
        }

        /// <summary>
        /// Delay dài hơn giữa các batch
        /// ANTI-SPAM: Randomize delay
        /// </summary>
        public void DelayBetweenBatches()
        {
            if (_config.DelayBetweenBatches > 0)
            {
                int delay = _config.DelayBetweenBatches;

                // Randomize delay: ±15%
                if (_config.RandomizeDelays)
                {
                    int variance = (int)(delay * 0.15);
                    int randomOffset = _random.Next(-variance, variance + 1);
                    delay = delay + randomOffset;
                    delay = Math.Max(1000, delay); // Minimum 1 giây
                }

                _logger.Log($"Nghỉ {delay}ms giữa các batch...");
                Thread.Sleep(delay);
            }
        }
    }
}
