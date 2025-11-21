using System;
using System.Collections.Generic;
using System.IO;
using System.Text;

namespace MassEmailSender
{
    /// <summary>
    /// Tracking progress để có thể resume nếu bị gián đoạn
    /// </summary>
    public class ProgressTracker
    {
        private string _progressFile;
        private HashSet<string> _sentEmails;
        private object _lockObj = new object();

        public ProgressTracker(string progressFile)
        {
            _progressFile = progressFile;
            _sentEmails = new HashSet<string>();

            LoadProgress();
        }

        /// <summary>
        /// Load progress từ file (nếu có)
        /// </summary>
        private void LoadProgress()
        {
            if (File.Exists(_progressFile))
            {
                foreach (string line in File.ReadLines(_progressFile, Encoding.UTF8))
                {
                    if (!string.IsNullOrWhiteSpace(line))
                    {
                        _sentEmails.Add(line.Trim().ToLower());
                    }
                }
            }
        }

        /// <summary>
        /// Kiểm tra xem email đã được gửi chưa
        /// </summary>
        public bool IsEmailSent(string email)
        {
            lock (_lockObj)
            {
                return _sentEmails.Contains(email.ToLower());
            }
        }

        /// <summary>
        /// Mark email là đã gửi thành công
        /// </summary>
        public void MarkAsSent(string email)
        {
            lock (_lockObj)
            {
                string emailLower = email.ToLower();

                if (!_sentEmails.Contains(emailLower))
                {
                    _sentEmails.Add(emailLower);

                    try
                    {
                        File.AppendAllText(_progressFile, email + Environment.NewLine, Encoding.UTF8);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Error writing to progress file: {ex.Message}");
                    }
                }
            }
        }

        /// <summary>
        /// Lấy số email đã gửi
        /// </summary>
        public int GetSentCount()
        {
            lock (_lockObj)
            {
                return _sentEmails.Count;
            }
        }

        /// <summary>
        /// Reset progress (xóa file progress)
        /// </summary>
        public void Reset()
        {
            lock (_lockObj)
            {
                _sentEmails.Clear();

                if (File.Exists(_progressFile))
                {
                    File.Delete(_progressFile);
                }
            }
        }
    }
}
