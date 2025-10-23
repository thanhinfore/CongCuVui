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

                string fromEmail = txtFromEmail.Text.Trim();
                string toEmail = txtToEmail.Text.Trim();
                string subject = txtSubject.Text.Trim();
                string body = txtBody.Text.Trim();

                // Tạo MailMessage
                using (MailMessage mail = new MailMessage())
                {
                    mail.From = new MailAddress(fromEmail);
                    mail.To.Add(toEmail);
                    mail.Subject = subject;
                    mail.Body = body;
                    mail.IsBodyHtml = false;

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

                // Hiển thị thông báo thành công
                ShowMessage($"✓ Email đã được gửi thành công!\n\nFrom: {fromEmail}\nTo: {toEmail}\nSMTP: {smtpHost}:{smtpPort}\nSSL: {enableSsl}", true);
            }
            catch (SmtpException smtpEx)
            {
                ShowMessage($"✗ SMTP Error:\n{smtpEx.Message}\n\nStatus Code: {smtpEx.StatusCode}\n\nKiểm tra:\n- Host/Port đúng chưa\n- Username/Password chính xác\n- SSL/TLS phù hợp (587→TLS, 465→SSL, 25→no SSL)\n- Firewall có chặn không", false);
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

        private void ShowMessage(string message, bool isSuccess)
        {
            pnlMessage.Visible = true;
            pnlMessage.CssClass = isSuccess ? "message success" : "message error";
            lblMessage.Text = message;
        }
    }
}