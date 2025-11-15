using System.Data.Entity;
using QuanLiQuanHeXaHoi.Models;

namespace QuanLiQuanHeXaHoi.Data
{
    /// <summary>
    /// Database context for Social Relationship Manager
    /// Using Entity Framework 6 with SQLite
    /// </summary>
    public class AppDbContext : DbContext
    {
        public AppDbContext() : base("name=DefaultConnection")
        {
            // Enable lazy loading
            Configuration.LazyLoadingEnabled = true;
            Configuration.ProxyCreationEnabled = true;
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Contact> Contacts { get; set; }

        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure User entity
            modelBuilder.Entity<User>()
                .HasMany(u => u.Contacts)
                .WithRequired(c => c.User)
                .HasForeignKey(c => c.UserId)
                .WillCascadeOnDelete(true);

            // Configure indexes
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Username)
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<Contact>()
                .HasIndex(c => c.UserId);

            modelBuilder.Entity<Contact>()
                .HasIndex(c => c.Level);
        }

        /// <summary>
        /// Initialize database with seed data if needed
        /// </summary>
        public static void Initialize()
        {
            using (var context = new AppDbContext())
            {
                // This will create the database if it doesn't exist
                context.Database.CreateIfNotExists();
            }
        }
    }
}
