using System;
using System.Linq;
using System.Web.Http;
using QuanLiQuanHeXaHoi.Data;
using QuanLiQuanHeXaHoi.Models;
using BCrypt.Net;

namespace QuanLiQuanHeXaHoi.Controllers
{
    /// <summary>
    /// API Controller for authentication (register, login)
    /// </summary>
    [RoutePrefix("api/auth")]
    public class AuthController : ApiController
    {
        private readonly AppDbContext _db = new AppDbContext();

        /// <summary>
        /// Register a new user
        /// POST api/auth/register
        /// </summary>
        [HttpPost]
        [Route("register")]
        public IHttpActionResult Register([FromBody] RegisterRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Ensure database is created
                _db.Database.CreateIfNotExists();

                // Check if username already exists
                if (_db.Users.Any(u => u.Username == request.Username))
                {
                    return BadRequest("Tên đăng nhập đã tồn tại");
                }

                // Check if email already exists
                if (_db.Users.Any(u => u.Email == request.Email))
                {
                    return BadRequest("Email đã được sử dụng");
                }

                // Create new user
                var user = new User
                {
                    Username = request.Username,
                    Email = request.Email,
                    FullName = request.FullName,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true
                };

                _db.Users.Add(user);
                _db.SaveChanges();

                var response = new LoginResponse
                {
                    UserId = user.Id,
                    Username = user.Username,
                    Email = user.Email,
                    FullName = user.FullName,
                    Token = GenerateSimpleToken(user.Id)
                };

                return Ok(ApiResponse<LoginResponse>.SuccessResult(response, "Đăng ký thành công!"));
            }
            catch (Exception ex)
            {
                // Log the error (in production, use proper logging)
                System.Diagnostics.Debug.WriteLine($"Register error: {ex.Message}");
                System.Diagnostics.Debug.WriteLine($"Stack trace: {ex.StackTrace}");

                return Content(System.Net.HttpStatusCode.InternalServerError,
                    ApiResponse<object>.ErrorResult($"Lỗi server: {ex.Message}"));
            }
        }

        /// <summary>
        /// Login user
        /// POST api/auth/login
        /// </summary>
        [HttpPost]
        [Route("login")]
        public IHttpActionResult Login([FromBody] LoginRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Find user by username or email
                var user = _db.Users.FirstOrDefault(u =>
                    u.Username == request.UsernameOrEmail ||
                    u.Email == request.UsernameOrEmail);

                if (user == null)
                {
                    return BadRequest("Tên đăng nhập hoặc mật khẩu không đúng");
                }

                // Verify password
                if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                {
                    return BadRequest("Tên đăng nhập hoặc mật khẩu không đúng");
                }

                if (!user.IsActive)
                {
                    return BadRequest("Tài khoản đã bị vô hiệu hóa");
                }

                // Update last login
                user.LastLoginAt = DateTime.UtcNow;
                _db.SaveChanges();

                var response = new LoginResponse
                {
                    UserId = user.Id,
                    Username = user.Username,
                    Email = user.Email,
                    FullName = user.FullName,
                    Token = GenerateSimpleToken(user.Id)
                };

                return Ok(ApiResponse<LoginResponse>.SuccessResult(response, "Đăng nhập thành công!"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Login error: {ex.Message}");
                System.Diagnostics.Debug.WriteLine($"Stack trace: {ex.StackTrace}");

                return Content(System.Net.HttpStatusCode.InternalServerError,
                    ApiResponse<object>.ErrorResult($"Lỗi server: {ex.Message}"));
            }
        }

        /// <summary>
        /// Check if username is available
        /// GET api/auth/check-username?username=xxx
        /// </summary>
        [HttpGet]
        [Route("check-username")]
        public IHttpActionResult CheckUsername(string username)
        {
            var exists = _db.Users.Any(u => u.Username == username);
            return Ok(new { available = !exists });
        }

        /// <summary>
        /// Check if email is available
        /// GET api/auth/check-email?email=xxx
        /// </summary>
        [HttpGet]
        [Route("check-email")]
        public IHttpActionResult CheckEmail(string email)
        {
            var exists = _db.Users.Any(u => u.Email == email);
            return Ok(new { available = !exists });
        }

        /// <summary>
        /// Generate a simple token (for demo purposes)
        /// In production, use JWT or similar
        /// </summary>
        private string GenerateSimpleToken(int userId)
        {
            return Convert.ToBase64String(
                System.Text.Encoding.UTF8.GetBytes($"{userId}:{Guid.NewGuid()}")
            );
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
