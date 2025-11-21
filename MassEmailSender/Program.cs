using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;

namespace MassEmailSender
{
    internal class Program
    {
        static void Main(string[] args)
        {
            Console.OutputEncoding = System.Text.Encoding.UTF8;
            Console.InputEncoding = System.Text.Encoding.UTF8;

            Console.WriteLine("╔═══════════════════════════════════════════════════════════╗");
            Console.WriteLine("║           MASS EMAIL SENDER - Luyện AI                   ║");
            Console.WriteLine("╚═══════════════════════════════════════════════════════════╝");
            Console.WriteLine();

            try
            {
                // Load configuration
                EmailConfig config = new EmailConfig();

                // Hiển thị configuration
                DisplayConfiguration(config);

                // Khởi tạo các components
                Logger logger = new Logger(config.LogFile, config.ErrorLogFile);
                ProgressTracker progressTracker = new ProgressTracker(config.ProgressFile);
                MaillistReader maillistReader = new MaillistReader(config.MaillistFile);
                EmailSender emailSender = new EmailSender(config, logger);

                // Đọc danh sách người nhận
                logger.Log("Đang đọc danh sách người nhận...");
                List<Recipient> allRecipients = maillistReader.ReadAll();
                logger.Log($"Đã load {allRecipients.Count} người nhận từ {config.MaillistFile}");

                // Kiểm tra progress để resume
                int previouslySent = progressTracker.GetSentCount();
                if (previouslySent > 0)
                {
                    logger.Log($"Phát hiện {previouslySent} email đã được gửi trước đó.");
                    Console.WriteLine();
                    Console.ForegroundColor = ConsoleColor.Yellow;
                    Console.WriteLine($"Bạn có muốn tiếp tục từ chỗ đã dừng không? (Y/N)");
                    Console.WriteLine("Chọn N để bắt đầu lại từ đầu và gửi tất cả.");
                    Console.ResetColor();

                    string response = Console.ReadLine()?.Trim().ToUpper();
                    if (response == "N")
                    {
                        logger.Log("Người dùng chọn bắt đầu lại từ đầu.");
                        progressTracker.Reset();
                        previouslySent = 0;
                    }
                    else
                    {
                        logger.Log("Tiếp tục từ chỗ đã dừng.");
                    }
                }

                // Filter recipients chưa được gửi
                List<Recipient> pendingRecipients = allRecipients
                    .Where(r => !progressTracker.IsEmailSent(r.Email))
                    .ToList();

                logger.Log($"Còn {pendingRecipients.Count} email cần gửi.");

                if (pendingRecipients.Count == 0)
                {
                    logger.Log("Tất cả email đã được gửi. Hoàn thành!");
                    Console.WriteLine();
                    Console.WriteLine("Nhấn phím bất kỳ để thoát...");
                    Console.ReadKey();
                    return;
                }

                // Xác nhận trước khi gửi
                Console.WriteLine();
                Console.ForegroundColor = ConsoleColor.Yellow;
                Console.WriteLine($"Sẵn sàng gửi {pendingRecipients.Count} email.");
                Console.WriteLine("Bạn có muốn tiếp tục? (Y/N)");
                Console.ResetColor();

                string confirm = Console.ReadLine()?.Trim().ToUpper();
                if (confirm != "Y")
                {
                    logger.Log("Người dùng hủy thực hiện.");
                    return;
                }

                // Bắt đầu gửi email
                logger.Log("Bắt đầu gửi email...");
                Console.WriteLine();

                Stopwatch stopwatch = Stopwatch.StartNew();
                int successCount = 0;
                int errorCount = 0;
                int totalToSend = pendingRecipients.Count;

                for (int i = 0; i < pendingRecipients.Count; i++)
                {
                    Recipient recipient = pendingRecipients[i];
                    int currentIndex = i + 1;

                    try
                    {
                        // Gửi email
                        bool success = emailSender.SendEmail(recipient);

                        if (success)
                        {
                            successCount++;
                            logger.LogSuccess(recipient.Email, recipient.Name);
                            progressTracker.MarkAsSent(recipient.Email);
                        }
                        else
                        {
                            errorCount++;
                        }

                        // Log progress mỗi 10 emails hoặc khi hoàn thành batch
                        if (currentIndex % 10 == 0 || currentIndex % config.BatchSize == 0 || currentIndex == totalToSend)
                        {
                            logger.LogProgress(currentIndex, totalToSend, successCount, errorCount);

                            // Tính toán thời gian còn lại
                            double elapsedSeconds = stopwatch.Elapsed.TotalSeconds;
                            double emailsPerSecond = currentIndex / elapsedSeconds;
                            int remainingEmails = totalToSend - currentIndex;
                            double estimatedSecondsRemaining = remainingEmails / emailsPerSecond;
                            TimeSpan estimatedTimeRemaining = TimeSpan.FromSeconds(estimatedSecondsRemaining);

                            Console.ForegroundColor = ConsoleColor.Gray;
                            Console.WriteLine($"  Ước tính thời gian còn lại: {estimatedTimeRemaining:hh\\:mm\\:ss}");
                            Console.ResetColor();
                        }

                        // Delay giữa các email
                        emailSender.DelayBetweenEmails();

                        // Delay dài hơn giữa các batch
                        if (currentIndex % config.BatchSize == 0 && currentIndex < totalToSend)
                        {
                            emailSender.DelayBetweenBatches();
                        }
                    }
                    catch (Exception ex)
                    {
                        errorCount++;
                        logger.LogError(recipient.Email, recipient.Name, ex);
                    }
                }

                stopwatch.Stop();

                // Hiển thị kết quả cuối cùng
                Console.WriteLine();
                Console.WriteLine("╔═══════════════════════════════════════════════════════════╗");
                Console.WriteLine("║                    KẾT QUẢ CUỐI CÙNG                     ║");
                Console.WriteLine("╚═══════════════════════════════════════════════════════════╝");
                logger.Log($"Hoàn thành! Thời gian: {stopwatch.Elapsed:hh\\:mm\\:ss}");
                logger.Log($"Tổng số email đã gửi: {successCount}");
                logger.Log($"Số lỗi: {errorCount}");
                logger.Log($"Tổng số email đã xử lý (bao gồm cả trước đó): {previouslySent + successCount}");

                Console.WriteLine();
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine($"✓ Thành công: {successCount}");
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine($"✗ Lỗi: {errorCount}");
                Console.ResetColor();

                if (errorCount > 0)
                {
                    Console.WriteLine();
                    Console.WriteLine($"Chi tiết lỗi được lưu trong: {config.ErrorLogFile}");
                }
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine($"LỖI NGHIÊM TRỌNG: {ex.Message}");
                Console.WriteLine($"StackTrace: {ex.StackTrace}");
                Console.ResetColor();
            }

            Console.WriteLine();
            Console.WriteLine("Nhấn phím bất kỳ để thoát...");
            Console.ReadKey();
        }

        /// <summary>
        /// Hiển thị configuration
        /// </summary>
        static void DisplayConfiguration(EmailConfig config)
        {
            Console.WriteLine("Configuration:");
            Console.WriteLine($"  SMTP: {config.SmtpHost}:{config.SmtpPort}");
            Console.WriteLine($"  From: {config.FromName} <{config.FromEmail}>");
            Console.WriteLine($"  Subject: {config.Subject}");
            Console.WriteLine($"  Delay between emails: {config.DelayBetweenEmails}ms");
            Console.WriteLine($"  Batch size: {config.BatchSize}");
            Console.WriteLine($"  Delay between batches: {config.DelayBetweenBatches}ms");
            Console.WriteLine($"  Max retries: {config.MaxRetries}");
            Console.WriteLine($"  Maillist file: {config.MaillistFile}");
            Console.WriteLine($"  Content file: {config.ContentFile}");
            Console.WriteLine();
        }
    }
}
