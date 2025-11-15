using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuanLiQuanHeXaHoi.Models
{
    /// <summary>
    /// Represents a user in the system
    /// </summary>
    public class User
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        [Index(IsUnique = true)]
        public string Username { get; set; }

        [Required]
        [StringLength(255)]
        [EmailAddress]
        [Index(IsUnique = true)]
        public string Email { get; set; }

        [Required]
        [StringLength(255)]
        public string PasswordHash { get; set; }

        [StringLength(100)]
        public string FullName { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? LastLoginAt { get; set; }

        public bool IsActive { get; set; }

        // Navigation property
        public virtual ICollection<Contact> Contacts { get; set; }

        public User()
        {
            CreatedAt = DateTime.UtcNow;
            IsActive = true;
            Contacts = new HashSet<Contact>();
        }
    }
}
