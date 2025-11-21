using System;
using System.IO;
using System.Text;

namespace MassEmailSender
{
    /// <summary>
    /// Logger để tracking progress và errors
    /// </summary>
    public class Logger
    {
        private string _logFile;
        private string _errorLogFile;
        private object _lockObj = new object();

        public Logger(string logFile, string errorLogFile)
        {
            _logFile = logFile;
            _errorLogFile = errorLogFile;
        }

        /// <summary>
        /// Log thông tin chung
        /// </summary>
        public void Log(string message)
        {
            string logMessage = $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] {message}";

            lock (_lockObj)
            {
                try
                {
                    File.AppendAllText(_logFile, logMessage + Environment.NewLine, Encoding.UTF8);
                    Console.WriteLine(logMessage);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error writing to log file: {ex.Message}");
                }
            }
        }

        /// <summary>
        /// Log email đã gửi thành công
        /// </summary>
        public void LogSuccess(string email, string name)
        {
            Log($"✓ SUCCESS: {email} - {name}");
        }

        /// <summary>
        /// Log lỗi
        /// </summary>
        public void LogError(string email, string name, Exception ex)
        {
            string errorMessage = $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] ✗ ERROR: {email} - {name}" + Environment.NewLine +
                                 $"  Exception: {ex.Message}" + Environment.NewLine +
                                 $"  StackTrace: {ex.StackTrace}" + Environment.NewLine;

            lock (_lockObj)
            {
                try
                {
                    File.AppendAllText(_errorLogFile, errorMessage + Environment.NewLine, Encoding.UTF8);
                    File.AppendAllText(_logFile, $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] ✗ ERROR: {email} - {name} - {ex.Message}" + Environment.NewLine, Encoding.UTF8);
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine($"✗ ERROR: {email} - {name} - {ex.Message}");
                    Console.ResetColor();
                }
                catch (Exception logEx)
                {
                    Console.WriteLine($"Error writing to error log file: {logEx.Message}");
                }
            }
        }

        /// <summary>
        /// Log progress
        /// </summary>
        public void LogProgress(int current, int total, int successCount, int errorCount)
        {
            double percentage = (double)current / total * 100;
            string message = $"Progress: {current}/{total} ({percentage:F2}%) - Success: {successCount} - Errors: {errorCount}";

            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.WriteLine($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] {message}");
            Console.ResetColor();

            lock (_lockObj)
            {
                try
                {
                    File.AppendAllText(_logFile, $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] {message}" + Environment.NewLine, Encoding.UTF8);
                }
                catch { }
            }
        }
    }
}
