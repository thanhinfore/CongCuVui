using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuanLiQuanHeXaHoi.Models
{
    /// <summary>
    /// Represents a contact/person in the social relationship management system
    /// Based on Dunbar's Number theory
    /// </summary>
    public class Contact
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [StringLength(200)]
        public string Name { get; set; }

        [StringLength(255)]
        [EmailAddress]
        public string Email { get; set; }

        [StringLength(50)]
        public string Phone { get; set; }

        /// <summary>
        /// Dunbar circle level: inner, close, good, friends, acquaintances, others
        /// </summary>
        [Required]
        [StringLength(20)]
        public string Level { get; set; }

        [StringLength(200)]
        public string MetAt { get; set; }

        public DateTime? MetDate { get; set; }

        public DateTime? LastMet { get; set; }

        [StringLength(200)]
        public string Company { get; set; }

        [StringLength(200)]
        public string Position { get; set; }

        [StringLength(500)]
        public string Facebook { get; set; }

        [StringLength(500)]
        public string Tags { get; set; }

        [StringLength(2000)]
        public string Notes { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        // Navigation property
        [ForeignKey("UserId")]
        public virtual User User { get; set; }

        public Contact()
        {
            CreatedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }
    }
}
