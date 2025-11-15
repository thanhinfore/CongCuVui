# Quản Lý Quan Hệ Xã Hội - Phiên Bản Backend

## 🎉 Phiên Bản Mới - Backend API + SQLite Database

Đây là phiên bản nâng cấp của ứng dụng Quản Lý Quan Hệ Xã Hội, bây giờ có **Backend API** và **SQLite Database** để:
- ✅ Lưu trữ dữ liệu lâu dài và an toàn
- ✅ Truy cập từ nhiều thiết bị (PC, mobile, tablet)
- ✅ Đăng nhập/Đăng ký để phân biệt users
- ✅ RESTful API đầy đủ
- ✅ Không giới hạn dung lượng như LocalStorage

---

## Cấu Trúc Dự Án

```
QuanLiQuanHeXaHoi/
├── App_Start/
│   └── WebApiConfig.cs          # Cấu hình Web API và CORS
├── Controllers/
│   ├── AuthController.cs        # API đăng ký/đăng nhập
│   ├── ContactsController.cs    # API CRUD contacts
│   └── StatisticsController.cs  # API thống kê Dunbar
├── Data/
│   └── AppDbContext.cs          # Entity Framework DbContext
├── Models/
│   ├── User.cs                  # Entity User
│   ├── Contact.cs               # Entity Contact
│   └── DTOs.cs                  # Data Transfer Objects
├── Properties/
│   └── AssemblyInfo.cs
├── index.html                   # Giao diện chính (sau khi login)
├── login.html                   # Trang đăng nhập/đăng ký
├── styles.css                   # Styles cho UI
├── app.js                       # JavaScript version cũ (LocalStorage)
├── app-api.js                   # JavaScript version mới (API calls)
├── Global.asax                  # Application startup
├── Global.asax.cs               # Application events
├── Web.config                   # Cấu hình ASP.NET & database
└── packages.config              # NuGet packages

Database:
└── App_Data/
    └── SocialRelationships.db   # SQLite database file (tự động tạo)
```

---

## Công Nghệ Sử Dụng

### Backend
- **ASP.NET Web API** (Framework 4.6.1)
- **Entity Framework 6** (ORM)
- **SQLite** (Database)
- **BCrypt.NET** (Password hashing)
- **Newtonsoft.Json** (JSON serialization)

### Frontend
- **HTML5, CSS3, JavaScript (ES6+)**
- **Fetch API** để gọi backend
- **Responsive Design**

---

## Cài Đặt và Chạy Dự Án

### Yêu Cầu
- Visual Studio 2017 hoặc mới hơn
- .NET Framework 4.6.1 trở lên
- IIS Express (đi kèm với Visual Studio)

### Bước 1: Restore NuGet Packages

Mở Visual Studio, mở solution `CongCuVui.sln`, sau đó:

```bash
# Trong Visual Studio:
# Tools > NuGet Package Manager > Package Manager Console
Update-Package -reinstall -Project QuanLiQuanHeXaHoi
```

Hoặc right-click vào solution → "Restore NuGet Packages"

### Bước 2: Build Project

```
Build > Build Solution (Ctrl+Shift+B)
```

### Bước 3: Chạy Ứng Dụng

```
Debug > Start Without Debugging (Ctrl+F5)
```

Ứng dụng sẽ tự động mở trình duyệt tại `http://localhost:47491/login.html`

---

## API Endpoints

### Authentication

#### POST `/api/auth/register`
Đăng ký user mới

**Request Body:**
```json
{
    "username": "thanh",
    "email": "thanh@example.com",
    "fullName": "Nguyễn Văn Thành",
    "password": "123456"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Đăng ký thành công!",
    "data": {
        "userId": 1,
        "username": "thanh",
        "email": "thanh@example.com",
        "fullName": "Nguyễn Văn Thành",
        "token": "base64_token_here"
    }
}
```

#### POST `/api/auth/login`
Đăng nhập

**Request Body:**
```json
{
    "usernameOrEmail": "thanh",
    "password": "123456"
}
```

#### GET `/api/auth/check-username?username=thanh`
Kiểm tra username có sẵn không

#### GET `/api/auth/check-email?email=thanh@example.com`
Kiểm tra email có sẵn không

---

### Contacts Management

#### GET `/api/contacts?userId=1`
Lấy tất cả contacts của user

**Response:**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "Nguyễn Văn A",
            "email": "a@example.com",
            "phone": "0912345678",
            "level": "inner",
            "company": "ABC Corp",
            "position": "CEO",
            ...
        }
    ]
}
```

#### GET `/api/contacts/5?userId=1`
Lấy 1 contact cụ thể

#### POST `/api/contacts?userId=1`
Tạo contact mới

**Request Body:**
```json
{
    "name": "Nguyễn Văn A",
    "email": "a@example.com",
    "phone": "0912345678",
    "level": "inner",
    "company": "ABC Corp",
    "position": "CEO",
    "metAt": "Hội nghị công nghệ",
    "metDate": "2024-01-15",
    "lastMet": "2024-11-10",
    "facebook": "facebook.com/nguyenvana",
    "tags": "công nghệ, startup, AI",
    "notes": "Rất am hiểu về AI"
}
```

#### PUT `/api/contacts/5?userId=1`
Cập nhật contact

#### DELETE `/api/contacts/5?userId=1`
Xóa contact

#### GET `/api/contacts/search?userId=1&q=keyword`
Tìm kiếm contacts

#### GET `/api/contacts/filter?userId=1&level=inner`
Lọc contacts theo level

---

### Statistics

#### GET `/api/statistics?userId=1`
Lấy thống kê Dunbar

**Response:**
```json
{
    "success": true,
    "data": {
        "totalContacts": 25,
        "dunbarCount": 20,
        "recentContacts": 5,
        "innerCircle": {
            "count": 3,
            "limit": 5,
            "percentage": 60.0
        },
        "closeFriends": {
            "count": 8,
            "limit": 15,
            "percentage": 53.33
        },
        ...
    }
}
```

---

## Database Schema

### Table: Users
| Column | Type | Description |
|--------|------|-------------|
| Id | INTEGER | Primary Key, Auto Increment |
| Username | VARCHAR(100) | Unique, Required |
| Email | VARCHAR(255) | Unique, Required |
| PasswordHash | VARCHAR(255) | BCrypt hash |
| FullName | VARCHAR(100) | Optional |
| CreatedAt | DATETIME | UTC timestamp |
| LastLoginAt | DATETIME | UTC timestamp |
| IsActive | BOOLEAN | Default: true |

### Table: Contacts
| Column | Type | Description |
|--------|------|-------------|
| Id | INTEGER | Primary Key, Auto Increment |
| UserId | INTEGER | Foreign Key to Users |
| Name | VARCHAR(200) | Required |
| Email | VARCHAR(255) | Optional |
| Phone | VARCHAR(50) | Optional |
| Level | VARCHAR(20) | Required (inner/close/good/friends/acquaintances/others) |
| MetAt | VARCHAR(200) | Where first met |
| MetDate | DATETIME | Date first met |
| LastMet | DATETIME | Last meeting date |
| Company | VARCHAR(200) | Optional |
| Position | VARCHAR(200) | Optional |
| Facebook | VARCHAR(500) | Optional |
| Tags | VARCHAR(500) | Comma-separated |
| Notes | VARCHAR(2000) | Optional |
| CreatedAt | DATETIME | UTC timestamp |
| UpdatedAt | DATETIME | UTC timestamp |

---

## Tính Năng Mới

### 1. Multi-User Support
- Mỗi user có tài khoản riêng
- Dữ liệu được phân tách theo userId
- Bảo mật với password hashing (BCrypt)

### 2. Cross-Device Access
- Dữ liệu lưu trên server
- Truy cập từ bất kỳ thiết bị nào có internet
- Đồng bộ real-time

### 3. RESTful API
- API đầy đủ cho CRUD operations
- JSON responses
- CORS enabled (có thể gọi từ domain khác)

### 4. Persistent Storage
- SQLite database
- Không bị giới hạn như LocalStorage (5-10MB)
- Backup dễ dàng (chỉ cần copy file .db)

---

## So Sánh 2 Phiên Bản

| Tính Năng | LocalStorage Version | Backend API Version |
|-----------|---------------------|-------------------|
| **Lưu trữ dữ liệu** | LocalStorage (browser) | SQLite Database (server) |
| **Đa thiết bị** | ❌ Không | ✅ Có |
| **Multi-user** | ❌ Không | ✅ Có |
| **Đăng nhập** | ❌ Không | ✅ Có |
| **Giới hạn dung lượng** | ~5-10MB | Không giới hạn thực tế |
| **Bảo mật** | ⚠️ Tất cả có thể xem | ✅ Password protected |
| **Backend** | ❌ Không cần | ✅ ASP.NET Web API |
| **Database** | ❌ Không | ✅ SQLite |
| **API** | ❌ Không | ✅ RESTful API |
| **File sử dụng** | index.html + app.js | index.html + app-api.js + login.html + Backend |

---

## Sử Dụng

### 1. Đăng Ký Tài Khoản

1. Mở `http://localhost:47491/login.html`
2. Click tab "Đăng Ký"
3. Điền thông tin:
   - Tên đăng nhập (tối thiểu 3 ký tự)
   - Email
   - Họ và tên
   - Mật khẩu (tối thiểu 6 ký tự)
4. Click "Đăng Ký"

### 2. Đăng Nhập

1. Click tab "Đăng Nhập"
2. Nhập tên đăng nhập hoặc email
3. Nhập mật khẩu
4. Click "Đăng Nhập"

### 3. Sử Dụng Ứng Dụng

Sau khi đăng nhập, bạn sẽ được chuyển đến trang chính. Tất cả tính năng giống phiên bản LocalStorage:

- ✅ Quản lý danh bạ (thêm/sửa/xóa)
- ✅ 6 vòng tròn Dunbar
- ✅ Dashboard thống kê
- ✅ Tìm kiếm và lọc
- ✅ Timeline gặp gỡ

**Khác biệt:** Dữ liệu được lưu trên server, có thể truy cập từ bất kỳ đâu!

### 4. Đăng Xuất

Click nút "Đăng Xuất" ở header.

---

## Deployment

### Local IIS
1. Publish project từ Visual Studio
2. Copy files vào thư mục IIS
3. Cấu hình IIS Application Pool (.NET 4.x)
4. Đảm bảo App_Data folder có quyền write

### Azure / Cloud
1. Tạo App Service trên Azure
2. Deploy từ Visual Studio hoặc CI/CD
3. Cấu hình connection string trong Azure Portal
4. Enable CORS nếu cần

### Docker (Optional)
```dockerfile
# Có thể containerize với Docker nếu cần
# Sử dụng mcr.microsoft.com/dotnet/framework/aspnet base image
```

---

## Bảo Mật

⚠️ **Lưu Ý Quan Trọng:**

Đây là phiên bản **DEMO**. Để sử dụng production, cần:

1. **JWT Token thay vì Simple Token**
   ```csharp
   // Implement JWT authentication
   // Thêm Microsoft.AspNet.WebApi.Jwt
   ```

2. **HTTPS bắt buộc**
   - Cấu hình SSL certificate
   - Redirect HTTP → HTTPS

3. **Rate Limiting**
   - Hạn chế số request per IP
   - Chống brute force attack

4. **Input Validation**
   - Tất cả đã có validation cơ bản
   - Có thể thêm anti-XSS, SQL injection protection

5. **Password Policy**
   - Yêu cầu password phức tạp hơn
   - 2FA (Two-Factor Authentication)

---

## Troubleshooting

### Lỗi: "Database không tạo được"
- Kiểm tra quyền write của thư mục App_Data
- Tạo thủ công: `mkdir App_Data`

### Lỗi: "500 Internal Server Error"
- Kiểm tra Web.config
- Xem Application Event Log trong Windows
- Debug trong Visual Studio

### Lỗi: "CORS blocked"
- Kiểm tra WebApiConfig.cs
- Đảm bảo CORS được enable
- Check browser console

### Lỗi: "Package restore failed"
- Restore packages manually
- Kiểm tra internet connection
- Update NuGet Package Manager

---

## Tương Lai

Các tính năng có thể phát triển:

- [ ] JWT Authentication thay Simple Token
- [ ] Forgot Password / Reset Password
- [ ] Email verification
- [ ] Profile management
- [ ] Export/Import dữ liệu (JSON, CSV)
- [ ] Mobile App (React Native / Flutter)
- [ ] Push notifications
- [ ] Social login (Facebook, Google)
- [ ] Advanced analytics & insights
- [ ] Reminders (nhắc gặp lại người quan trọng)
- [ ] Integration với CRM systems
- [ ] Team collaboration features

---

## Tác Giả

**Thành** - 2024

Dựa trên nghiên cứu **Số Dunbar** của Robin Dunbar

---

## License

MIT License - Open Source

---

**Chúc bạn quản lý quan hệ xã hội hiệu quả! 🚀**

*Liên hệ: Nếu có bug hoặc câu hỏi, vui lòng tạo issue trên GitHub.*
