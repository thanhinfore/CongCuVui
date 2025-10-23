using System;
using System.Net;
using System.Net.Mail;

namespace TestSendEmail
{
    public partial class Default : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            // Có thể thêm logic khởi tạo nếu cần
        }

        protected void btnSend_Click(object sender, EventArgs e)
        {
            if (!Page.IsValid)
            {
                return;
            }

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

                // Tạo MailMessage
                using (MailMessage mail = new MailMessage())
                {
                    // Set From address với tên người gửi nếu có
                    if (!string.IsNullOrEmpty(fromName))
                    {
                        mail.From = new MailAddress(fromEmail, fromName);
                    }
                    else
                    {
                        mail.From = new MailAddress(fromEmail);
                    }

                    // Add To addresses (có thể có nhiều email, ngăn cách bởi ;)
                    AddEmailAddresses(mail.To, toEmail);

                    // Add CC addresses nếu có
                    if (!string.IsNullOrEmpty(ccEmail))
                    {
                        AddEmailAddresses(mail.CC, ccEmail);
                    }

                    // Add BCC addresses nếu có
                    if (!string.IsNullOrEmpty(bccEmail))
                    {
                        AddEmailAddresses(mail.Bcc, bccEmail);
                    }

                    mail.Subject = subject;
                    mail.Body = body;
                    mail.IsBodyHtml = isHtml;

                    // Cấu hình SmtpClient
                    using (SmtpClient smtp = new SmtpClient(smtpHost, smtpPort))
                    {
                        smtp.Credentials = new NetworkCredential(username, password);
                        smtp.EnableSsl = enableSsl;
                        smtp.Timeout = 30000; // 30 seconds

                        // Gửi email
                        smtp.Send(mail);
                    }
                }

                // Hiển thị thông báo thành công với thông tin chi tiết
                string successMessage = $"✓ Email đã được gửi thành công!\n\n" +
                                      $"SMTP Server: {smtpHost}:{smtpPort}\n" +
                                      $"SSL/TLS: {(enableSsl ? "Enabled" : "Disabled")}\n" +
                                      $"From: {(string.IsNullOrEmpty(fromName) ? fromEmail : $"{fromName} <{fromEmail}>")}\n" +
                                      $"To: {toEmail}\n";

                if (!string.IsNullOrEmpty(ccEmail))
                    successMessage += $"CC: {ccEmail}\n";

                if (!string.IsNullOrEmpty(bccEmail))
                    successMessage += $"BCC: {bccEmail}\n";

                successMessage += $"Subject: {subject}\n" +
                                $"Format: {(isHtml ? "HTML" : "Plain Text")}";

                ShowMessage(successMessage, true);
            }
            catch (SmtpException smtpEx)
            {
                string errorMessage = $"✗ SMTP Error:\n{smtpEx.Message}\n\n";

                if (smtpEx.StatusCode != 0)
                    errorMessage += $"Status Code: {smtpEx.StatusCode}\n\n";

                errorMessage += "Kiểm tra:\n" +
                              "- Host/Port đúng chưa? (mail.luyenai.vn:587 hoặc :465)\n" +
                              "- Username/Password chính xác?\n" +
                              "- SSL/TLS phù hợp? (587→TLS Enabled, 465→SSL Enabled, 25→No SSL)\n" +
                              "- Firewall có chặn kết nối không?\n" +
                              "- Email domain có được phép gửi không?";

                ShowMessage(errorMessage, false);
            }
            catch (FormatException formatEx)
            {
                ShowMessage($"✗ Format Error: {formatEx.Message}\n\nKiểm tra định dạng email và port number", false);
            }
            catch (Exception ex)
            {
                ShowMessage($"✗ Unexpected Error:\n{ex.GetType().Name}: {ex.Message}\n\nStack Trace:\n{ex.StackTrace}", false);
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