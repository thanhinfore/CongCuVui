using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Http;
using QuanLiQuanHeXaHoi.Data;
using QuanLiQuanHeXaHoi.Models;

namespace QuanLiQuanHeXaHoi.Controllers
{
    /// <summary>
    /// API Controller for managing contacts
    /// </summary>
    [RoutePrefix("api/contacts")]
    public class ContactsController : ApiController
    {
        private readonly AppDbContext _db = new AppDbContext();

        /// <summary>
        /// Get all contacts for a user
        /// GET api/contacts?userId=1
        /// </summary>
        [HttpGet]
        [Route("")]
        public IHttpActionResult GetContacts(int userId)
        {
            var contacts = _db.Contacts
                .Where(c => c.UserId == userId)
                .OrderBy(c => c.Name)
                .ToList();

            var contactDTOs = contacts.Select(ContactDTO.FromContact).ToList();

            return Ok(ApiResponse<List<ContactDTO>>.SuccessResult(contactDTOs));
        }

        /// <summary>
        /// Get a single contact by ID
        /// GET api/contacts/5?userId=1
        /// </summary>
        [HttpGet]
        [Route("{id:int}")]
        public IHttpActionResult GetContact(int id, int userId)
        {
            var contact = _db.Contacts.FirstOrDefault(c => c.Id == id && c.UserId == userId);

            if (contact == null)
            {
                return NotFound();
            }

            return Ok(ApiResponse<ContactDTO>.SuccessResult(ContactDTO.FromContact(contact)));
        }

        /// <summary>
        /// Create a new contact
        /// POST api/contacts?userId=1
        /// </summary>
        [HttpPost]
        [Route("")]
        public IHttpActionResult CreateContact(int userId, [FromBody] CreateContactRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Validate Dunbar limits
            var validationResult = ValidateDunbarLimit(userId, request.Level);
            if (!validationResult.IsValid)
            {
                return BadRequest(validationResult.Message);
            }

            var contact = new Contact
            {
                UserId = userId,
                Name = request.Name,
                Email = request.Email,
                Phone = request.Phone,
                Level = request.Level,
                MetAt = request.MetAt,
                MetDate = request.MetDate,
                LastMet = request.LastMet,
                Company = request.Company,
                Position = request.Position,
                Facebook = request.Facebook,
                Tags = request.Tags,
                Notes = request.Notes,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _db.Contacts.Add(contact);
            _db.SaveChanges();

            return Ok(ApiResponse<ContactDTO>.SuccessResult(
                ContactDTO.FromContact(contact),
                "Thêm người thành công!"
            ));
        }

        /// <summary>
        /// Update an existing contact
        /// PUT api/contacts/5?userId=1
        /// </summary>
        [HttpPut]
        [Route("{id:int}")]
        public IHttpActionResult UpdateContact(int id, int userId, [FromBody] UpdateContactRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var contact = _db.Contacts.FirstOrDefault(c => c.Id == id && c.UserId == userId);

            if (contact == null)
            {
                return NotFound();
            }

            // Validate Dunbar limits (excluding current contact)
            if (contact.Level != request.Level)
            {
                var validationResult = ValidateDunbarLimit(userId, request.Level, id);
                if (!validationResult.IsValid)
                {
                    return BadRequest(validationResult.Message);
                }
            }

            // Update contact
            contact.Name = request.Name;
            contact.Email = request.Email;
            contact.Phone = request.Phone;
            contact.Level = request.Level;
            contact.MetAt = request.MetAt;
            contact.MetDate = request.MetDate;
            contact.LastMet = request.LastMet;
            contact.Company = request.Company;
            contact.Position = request.Position;
            contact.Facebook = request.Facebook;
            contact.Tags = request.Tags;
            contact.Notes = request.Notes;
            contact.UpdatedAt = DateTime.UtcNow;

            _db.SaveChanges();

            return Ok(ApiResponse<ContactDTO>.SuccessResult(
                ContactDTO.FromContact(contact),
                "Cập nhật thành công!"
            ));
        }

        /// <summary>
        /// Delete a contact
        /// DELETE api/contacts/5?userId=1
        /// </summary>
        [HttpDelete]
        [Route("{id:int}")]
        public IHttpActionResult DeleteContact(int id, int userId)
        {
            var contact = _db.Contacts.FirstOrDefault(c => c.Id == id && c.UserId == userId);

            if (contact == null)
            {
                return NotFound();
            }

            _db.Contacts.Remove(contact);
            _db.SaveChanges();

            return Ok(ApiResponse<object>.SuccessResult(null, "Đã xóa thành công!"));
        }

        /// <summary>
        /// Search contacts
        /// GET api/contacts/search?userId=1&q=keyword
        /// </summary>
        [HttpGet]
        [Route("search")]
        public IHttpActionResult SearchContacts(int userId, string q = "")
        {
            var query = _db.Contacts.Where(c => c.UserId == userId);

            if (!string.IsNullOrWhiteSpace(q))
            {
                q = q.ToLower();
                query = query.Where(c =>
                    c.Name.ToLower().Contains(q) ||
                    (c.Email != null && c.Email.ToLower().Contains(q)) ||
                    (c.Phone != null && c.Phone.Contains(q)) ||
                    (c.Company != null && c.Company.ToLower().Contains(q)) ||
                    (c.Notes != null && c.Notes.ToLower().Contains(q)) ||
                    (c.Tags != null && c.Tags.ToLower().Contains(q))
                );
            }

            var contacts = query.OrderBy(c => c.Name).ToList();
            var contactDTOs = contacts.Select(ContactDTO.FromContact).ToList();

            return Ok(ApiResponse<List<ContactDTO>>.SuccessResult(contactDTOs));
        }

        /// <summary>
        /// Filter contacts by level
        /// GET api/contacts/filter?userId=1&level=inner
        /// </summary>
        [HttpGet]
        [Route("filter")]
        public IHttpActionResult FilterContacts(int userId, string level = "")
        {
            var query = _db.Contacts.Where(c => c.UserId == userId);

            if (!string.IsNullOrWhiteSpace(level))
            {
                query = query.Where(c => c.Level == level);
            }

            var contacts = query.OrderBy(c => c.Name).ToList();
            var contactDTOs = contacts.Select(ContactDTO.FromContact).ToList();

            return Ok(ApiResponse<List<ContactDTO>>.SuccessResult(contactDTOs));
        }

        /// <summary>
        /// Validate Dunbar limits for a given level
        /// </summary>
        private (bool IsValid, string Message) ValidateDunbarLimit(int userId, string level, int? excludeContactId = null)
        {
            if (level == "others")
            {
                return (true, null);
            }

            var limits = new Dictionary<string, int>
            {
                { "inner", 5 },
                { "close", 15 },
                { "good", 50 },
                { "friends", 150 },
                { "acquaintances", 500 }
            };

            if (!limits.ContainsKey(level))
            {
                return (false, "Mức độ quan hệ không hợp lệ");
            }

            var query = _db.Contacts.Where(c => c.UserId == userId && c.Level == level);

            if (excludeContactId.HasValue)
            {
                query = query.Where(c => c.Id != excludeContactId.Value);
            }

            var currentCount = query.Count();
            var limit = limits[level];

            if (currentCount >= limit)
            {
                return (false, $"Bạn đã đạt giới hạn cho nhóm này ({limit} người). Vui lòng chọn nhóm khác hoặc xóa bớt người trong nhóm hiện tại.");
            }

            return (true, null);
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
