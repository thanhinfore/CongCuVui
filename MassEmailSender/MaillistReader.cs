using System;
using System.Collections.Generic;
using System.IO;
using System.Text;

namespace MassEmailSender
{
    /// <summary>
    /// Đọc và parse file maillist.txt
    /// </summary>
    public class MaillistReader
    {
        private string _filePath;

        public MaillistReader(string filePath)
        {
            _filePath = filePath;
        }

        /// <summary>
        /// Đọc tất cả recipients từ file
        /// </summary>
        public List<Recipient> ReadAll()
        {
            List<Recipient> recipients = new List<Recipient>();

            if (!File.Exists(_filePath))
            {
                throw new FileNotFoundException($"Không tìm thấy file: {_filePath}");
            }

            int lineNumber = 0;
            foreach (string line in File.ReadLines(_filePath, Encoding.UTF8))
            {
                lineNumber++;

                // Skip empty lines
                if (string.IsNullOrWhiteSpace(line))
                    continue;

                try
                {
                    Recipient recipient = ParseLine(line);
                    if (recipient != null)
                    {
                        recipients.Add(recipient);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Warning: Lỗi parse dòng {lineNumber}: {line}");
                    Console.WriteLine($"  Error: {ex.Message}");
                }
            }

            return recipients;
        }

        /// <summary>
        /// Parse một dòng thành Recipient
        /// Format: email[TAB]name
        /// </summary>
        private Recipient ParseLine(string line)
        {
            if (string.IsNullOrWhiteSpace(line))
                return null;

            // Split by tab
            string[] parts = line.Split('\t');

            if (parts.Length < 2)
            {
                // Thử split bằng nhiều spaces nếu không có tab
                parts = line.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length < 2)
                {
                    throw new FormatException($"Định dạng không hợp lệ. Cần: email[TAB]name");
                }
            }

            string email = parts[0].Trim();
            string name = parts[1].Trim();

            // Validate email
            if (!IsValidEmail(email))
            {
                throw new FormatException($"Email không hợp lệ: {email}");
            }

            return new Recipient(email, name);
        }

        /// <summary>
        /// Kiểm tra email hợp lệ (đơn giản)
        /// </summary>
        private bool IsValidEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return false;

            try
            {
                var addr = new System.Net.Mail.MailAddress(email);
                return addr.Address == email;
            }
            catch
            {
                return false;
            }
        }
    }
}
