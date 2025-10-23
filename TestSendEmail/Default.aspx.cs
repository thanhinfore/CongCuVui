using System;
using System.Net;
using System.Net.Mail;
using System.Text;

namespace TestSendEmail
{
    public partial class Default : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            if (!IsPostBack)
            {
                // Set default From Email bằng Username khi load lần đầu
                if (!string.IsNullOrEmpty(txtUsername.Text))
                {
                    txtFromEmail.Text = txtUsername.Text;
                }
            }
        }

        protected void btnSend_Click(object sender, EventArgs e)
        {
            if (!Page.IsValid)
            {
                return;
            }

            StringBuilder debugInfo = new StringBuilder();

            try
            {
                // Lấy thông tin từ form
                string smtpHost = txtSmtpHost.Text.Trim();
                int smtpPort = int.Parse(txtSmtpPort.Text.Trim());
                string username = txtUsername.Text.Trim();
                string password = txtPassword.Text.Trim();
                bool enableSsl = chkEnableSSL.Checked;

                string fromName = txtFromName.Text.Trim();
                string fromEmail = txtFromEmail.Text.Trim();
                string toEmail = txtToEmail.Text.Trim();
                string ccEmail = txtCcEmail.Text.Trim();
                string bccEmail = txtBccEmail.Text.Trim();
                string subject = txtSubject.Text.Trim();
                string body = txtBody.Text.Trim();
                bool isHtml = chkIsHtml.Checked;

                // QUAN TRỌNG: Kiểm tra From Email có khớp với Username không
                bool fromEmailMatchesUsername = fromEmail.Equals(username, StringComparison.OrdinalIgnoreCase);

                debugInfo.AppendLine("=== DEBUG INFO ===");
                debugInfo.AppendLine($"SMTP Username: {username}");
                debugInfo.AppendLine($"From Email: {fromEmail}");
                debugInfo.AppendLine($"Match: {(fromEmailMatchesUsername ? "✓ YES" : "✗ NO - WARNING!")}");
                debugInfo.AppendLine();

                // Tạo MailMessage
                using (MailMessage mail = new MailMessage())
                {
                    // Set From address với tên người gửi nếu có
                    if (!string.IsNullOrEmpty(fromName))
                    {
                        mail.From = new MailAddress(fromEmail, fromName);
                        debugInfo.AppendLine($"From: {fromName} <{fromEmail}>");
                    }
                    else
                    {
                        mail.From = new MailAddress(fromEmail);
                        debugInfo.AppendLine($"From: {fromEmail}");
                    }

                    // Add To addresses (có thể có nhiều email, ngăn cách bởi ;)
                    AddEmailAddresses(mail.To, toEmail);
                    debugInfo.AppendLine($"To: {toEmail}");

                    // Add CC addresses nếu có
                    if (!string.IsNullOrEmpty(ccEmail))
                    {
                        AddEmailAddresses(mail.CC, ccEmail);
                        debugInfo.AppendLine($"CC: {ccEmail}");
                    }

                    // Add BCC addresses nếu có
                    if (!string.IsNullOrEmpty(bccEmail))
                    {
                        AddEmailAddresses(mail.Bcc, bccEmail);
                        debugInfo.AppendLine($"BCC: {bccEmail}");
                    }

                    mail.Subject = subject;
                    mail.Body = body;
                    mail.IsBodyHtml = isHtml;

                    debugInfo.AppendLine($"Subject: {subject}");
                    debugInfo.AppendLine($"Body Length: {body.Length} chars");
                    debugInfo.AppendLine($"HTML: {isHtml}");
                    debugInfo.AppendLine();

                    // Cấu hình SmtpClient
                    using (SmtpClient smtp = new SmtpClient(smtpHost, smtpPort))
                    {
                        smtp.Credentials = new NetworkCredential(username, password);
                        smtp.EnableSsl = enableSsl;
                        smtp.Timeout = 30000; // 30 seconds

                        // Enable detailed delivery notification
                        mail.DeliveryNotificationOptions = DeliveryNotificationOptions.OnSuccess | DeliveryNotificationOptions.OnFailure;

                        debugInfo.AppendLine($"Connecting to {smtpHost}:{smtpPort}...");
                        debugInfo.AppendLine($"SSL/TLS: {enableSsl}");
                        debugInfo.AppendLine($"Timeout: 30s");
                        debugInfo.AppendLine();

                        // Gửi email
                        DateTime sendTime = DateTime.Now;
                        smtp.Send(mail);
                        DateTime sentTime = DateTime.Now;
                        TimeSpan duration = sentTime - sendTime;

                        debugInfo.AppendLine($"✓ Email sent successfully in {duration.TotalSeconds:F2}s");
                        debugInfo.AppendLine($"Sent at: {sentTime:yyyy-MM-dd HH:mm:ss}");
                    }
                }

                // Hiển thị thông báo thành công với DEBUG INFO đầy đủ
                StringBuilder successMessage = new StringBuilder();
                successMessage.AppendLine("✓ Email đã được gửi đến SMTP server thành công!");
                successMessage.AppendLine();

                // Warning nếu From Email không khớp với Username
                if (!fromEmailMatchesUsername)
                {
                    successMessage.AppendLine("⚠️ CẢNH BÁO:");
                    successMessage.AppendLine($"From Email ({fromEmail}) KHÁC Username ({username})");
                    successMessage.AppendLine("Một số SMTP server có thể từ chối hoặc đánh dấu spam!");
                    successMessage.AppendLine();
                }

                successMessage.AppendLine("📧 KIỂM TRA EMAIL:");
                successMessage.AppendLine("1. Kiểm tra hộp thư INBOX của người nhận");
                successMessage.AppendLine("2. Kiểm tra thư mục SPAM/JUNK (rất quan trọng!)");
                successMessage.AppendLine("3. Kiểm tra thư mục PROMOTIONS (với Gmail)");
                successMessage.AppendLine("4. Có thể mất 1-5 phút để email đến");
                successMessage.AppendLine();

                successMessage.Append(debugInfo.ToString());

                ShowMessage(successMessage.ToString(), true);
            }
            catch (SmtpException smtpEx)
            {
                StringBuilder errorMessage = new StringBuilder();
                errorMessage.AppendLine("✗ SMTP Error:");
                errorMessage.AppendLine(smtpEx.Message);
                errorMessage.AppendLine();

                if (smtpEx.StatusCode != 0)
                {
                    errorMessage.AppendLine($"Status Code: {smtpEx.StatusCode}");
                    errorMessage.AppendLine();
                }

                if (smtpEx.InnerException != null)
                {
                    errorMessage.AppendLine($"Inner Exception: {smtpEx.InnerException.Message}");
                    errorMessage.AppendLine();
                }

                errorMessage.AppendLine("KIỂM TRA CÁC VẤN ĐỀ SAU:");
                errorMessage.AppendLine("1. Host/Port đúng chưa? (mail.luyenai.vn:587 hoặc :465)");
                errorMessage.AppendLine("2. Username/Password chính xác?");
                errorMessage.AppendLine("3. From Email có khớp với Username không?");
                errorMessage.AppendLine("4. SSL/TLS phù hợp? (587→TLS, 465→SSL, 25→No SSL)");
                errorMessage.AppendLine("5. Firewall có chặn kết nối không?");
                errorMessage.AppendLine("6. Email domain có được phép gửi không?");
                errorMessage.AppendLine();

                if (debugInfo.Length > 0)
                {
                    errorMessage.AppendLine("--- DEBUG INFO AT FAILURE ---");
                    errorMessage.Append(debugInfo.ToString());
                }

                ShowMessage(errorMessage.ToString(), false);
            }
            catch (FormatException formatEx)
            {
                ShowMessage($"✗ Format Error: {formatEx.Message}\n\nKiểm tra định dạng email và port number\n\nDebug Info:\n{debugInfo}", false);
            }
            catch (Exception ex)
            {
                StringBuilder errorMessage = new StringBuilder();
                errorMessage.AppendLine($"✗ Unexpected Error:");
                errorMessage.AppendLine($"{ex.GetType().Name}: {ex.Message}");
                errorMessage.AppendLine();
                errorMessage.AppendLine("Stack Trace:");
                errorMessage.AppendLine(ex.StackTrace);
                errorMessage.AppendLine();

                if (debugInfo.Length > 0)
                {
                    errorMessage.AppendLine("--- DEBUG INFO AT FAILURE ---");
                    errorMessage.Append(debugInfo.ToString());
                }

                ShowMessage(errorMessage.ToString(), false);
            }
        }

        /// <summary>
        /// Thêm nhiều địa chỉ email vào collection (ngăn cách bởi ; hoặc ,)
        /// </summary>
        private void AddEmailAddresses(System.Net.Mail.MailAddressCollection collection, string addresses)
        {
            if (string.IsNullOrWhiteSpace(addresses))
                return;

            // Split bởi ; hoặc ,
            string[] emails = addresses.Split(new[] { ';', ',' }, StringSplitOptions.RemoveEmptyEntries);

            foreach (string email in emails)
            {
                string trimmedEmail = email.Trim();
                if (!string.IsNullOrEmpty(trimmedEmail))
                {
                    collection.Add(new MailAddress(trimmedEmail));
                }
            }
        }

        private void ShowMessage(string message, bool isSuccess)
        {
            pnlMessage.Visible = true;
            pnlMessage.CssClass = isSuccess ? "message success" : "message error";
            lblMessage.Text = message;
        }
    }
}