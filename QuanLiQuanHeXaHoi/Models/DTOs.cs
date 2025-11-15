using System;
using System.ComponentModel.DataAnnotations;

namespace QuanLiQuanHeXaHoi.Models
{
    // ===== Authentication DTOs =====

    public class RegisterRequest
    {
        [Required]
        [StringLength(100, MinimumLength = 3)]
        public string Username { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        [StringLength(100, MinimumLength = 6)]
        public string Password { get; set; }

        public string FullName { get; set; }
    }

    public class LoginRequest
    {
        [Required]
        public string UsernameOrEmail { get; set; }

        [Required]
        public string Password { get; set; }
    }

    public class LoginResponse
    {
        public int UserId { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public string FullName { get; set; }
        public string Token { get; set; }
    }

    // ===== Contact DTOs =====

    public class ContactDTO
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string Level { get; set; }
        public string MetAt { get; set; }
        public DateTime? MetDate { get; set; }
        public DateTime? LastMet { get; set; }
        public string Company { get; set; }
        public string Position { get; set; }
        public string Facebook { get; set; }
        public string Tags { get; set; }
        public string Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public static ContactDTO FromContact(Contact contact)
        {
            return new ContactDTO
            {
                Id = contact.Id,
                Name = contact.Name,
                Email = contact.Email,
                Phone = contact.Phone,
                Level = contact.Level,
                MetAt = contact.MetAt,
                MetDate = contact.MetDate,
                LastMet = contact.LastMet,
                Company = contact.Company,
                Position = contact.Position,
                Facebook = contact.Facebook,
                Tags = contact.Tags,
                Notes = contact.Notes,
                CreatedAt = contact.CreatedAt,
                UpdatedAt = contact.UpdatedAt
            };
        }
    }

    public class CreateContactRequest
    {
        [Required]
        [StringLength(200)]
        public string Name { get; set; }

        [EmailAddress]
        public string Email { get; set; }

        public string Phone { get; set; }

        [Required]
        public string Level { get; set; }

        public string MetAt { get; set; }
        public DateTime? MetDate { get; set; }
        public DateTime? LastMet { get; set; }
        public string Company { get; set; }
        public string Position { get; set; }
        public string Facebook { get; set; }
        public string Tags { get; set; }
        public string Notes { get; set; }
    }

    public class UpdateContactRequest
    {
        [Required]
        [StringLength(200)]
        public string Name { get; set; }

        [EmailAddress]
        public string Email { get; set; }

        public string Phone { get; set; }

        [Required]
        public string Level { get; set; }

        public string MetAt { get; set; }
        public DateTime? MetDate { get; set; }
        public DateTime? LastMet { get; set; }
        public string Company { get; set; }
        public string Position { get; set; }
        public string Facebook { get; set; }
        public string Tags { get; set; }
        public string Notes { get; set; }
    }

    // ===== Statistics DTOs =====

    public class DunbarStatistics
    {
        public int TotalContacts { get; set; }
        public int DunbarCount { get; set; }
        public int RecentContacts { get; set; }
        public CircleStats InnerCircle { get; set; }
        public CircleStats CloseFriends { get; set; }
        public CircleStats GoodFriends { get; set; }
        public CircleStats Friends { get; set; }
        public CircleStats Acquaintances { get; set; }
        public CircleStats Others { get; set; }
    }

    public class CircleStats
    {
        public int Count { get; set; }
        public int Limit { get; set; }
        public double Percentage { get; set; }
    }

    // ===== API Response =====

    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public T Data { get; set; }

        public static ApiResponse<T> SuccessResult(T data, string message = null)
        {
            return new ApiResponse<T>
            {
                Success = true,
                Message = message,
                Data = data
            };
        }

        public static ApiResponse<T> ErrorResult(string message)
        {
            return new ApiResponse<T>
            {
                Success = false,
                Message = message,
                Data = default(T)
            };
        }
    }
}
