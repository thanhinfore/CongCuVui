using System;
using System.Linq;
using System.Web.Http;
using QuanLiQuanHeXaHoi.Data;
using QuanLiQuanHeXaHoi.Models;

namespace QuanLiQuanHeXaHoi.Controllers
{
    /// <summary>
    /// API Controller for Dunbar statistics
    /// </summary>
    [RoutePrefix("api/statistics")]
    public class StatisticsController : ApiController
    {
        private readonly AppDbContext _db = new AppDbContext();

        /// <summary>
        /// Get Dunbar statistics for a user
        /// GET api/statistics?userId=1
        /// </summary>
        [HttpGet]
        [Route("")]
        public IHttpActionResult GetStatistics(int userId)
        {
            var contacts = _db.Contacts.Where(c => c.UserId == userId).ToList();

            var totalContacts = contacts.Count;
            var dunbarCount = contacts.Count(c =>
                c.Level == "inner" ||
                c.Level == "close" ||
                c.Level == "good" ||
                c.Level == "friends"
            );

            var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
            var recentContacts = contacts.Count(c => c.LastMet.HasValue && c.LastMet.Value >= thirtyDaysAgo);

            var statistics = new DunbarStatistics
            {
                TotalContacts = totalContacts,
                DunbarCount = dunbarCount,
                RecentContacts = recentContacts,
                InnerCircle = GetCircleStats(contacts, "inner", 5),
                CloseFriends = GetCircleStats(contacts, "close", 15),
                GoodFriends = GetCircleStats(contacts, "good", 50),
                Friends = GetCircleStats(contacts, "friends", 150),
                Acquaintances = GetCircleStats(contacts, "acquaintances", 500),
                Others = GetCircleStats(contacts, "others", null)
            };

            return Ok(ApiResponse<DunbarStatistics>.SuccessResult(statistics));
        }

        /// <summary>
        /// Get statistics for a specific circle
        /// </summary>
        private CircleStats GetCircleStats(System.Collections.Generic.List<Contact> contacts, string level, int? limit)
        {
            var count = contacts.Count(c => c.Level == level);
            var percentage = limit.HasValue && limit.Value > 0
                ? Math.Min((double)count / limit.Value * 100, 100)
                : (count > 0 ? 100 : 0);

            return new CircleStats
            {
                Count = count,
                Limit = limit ?? 0,
                Percentage = Math.Round(percentage, 2)
            };
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                _db.Dispose();
            }
            base.Dispose(disposing);
        }
    }
}
