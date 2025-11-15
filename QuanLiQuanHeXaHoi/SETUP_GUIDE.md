# Hướng Dẫn Setup Project - QuanLiQuanHeXaHoi

## ⚠️ QUAN TRỌNG: Đọc Trước Khi Build

Project này là **ASP.NET Web API 2** trên **.NET Framework 4.6.1**, KHÔNG phải ASP.NET Core.

---

## Bước 1: Kiểm Tra Project Type

1. Mở Visual Studio
2. Mở solution: `CongCuVui.sln`
3. Chuột phải vào project `QuanLiQuanHeXaHoi` → **Properties**
4. Kiểm tra:
   - **Application** tab → **Target framework**: Phải là `.NET Framework 4.6.1` (hoặc 4.x)
   - KHÔNG được là `.NET 6`, `.NET 7`, `.NET 8` (đó là .NET Core)

✅ Nếu đúng → Tiếp tục bước 2
❌ Nếu sai → Xem phần "Troubleshooting" bên dưới

---

## Bước 2: Restore NuGet Packages

**Phương pháp 1: Tự động (Khuyến nghị)**

1. Trong Visual Studio, chọn menu:
   ```
   Tools → Options → NuGet Package Manager → General
   ```
2. Đảm bảo check vào:
   - ✅ "Allow NuGet to download missing packages"
   - ✅ "Automatically check for missing packages during build"
3. Click **OK**
4. Chuột phải vào **Solution** → **Restore NuGet Packages**
5. Đợi cho đến khi thấy thông báo "Restore completed"

**Phương pháp 2: Sử dụng Package Manager Console**

1. Mở Package Manager Console:
   ```
   Tools → NuGet Package Manager → Package Manager Console
   ```
2. Chạy lệnh:
   ```powershell
   Update-Package -reinstall -Project QuanLiQuanHeXaHoi
   ```
3. Đợi tất cả packages được cài đặt

**Phương pháp 3: Manual (Nếu 2 cách trên không work)**

1. Chuột phải vào project `QuanLiQuanHeXaHoi` → **Manage NuGet Packages**
2. Tab **Browse**, tìm và cài các package sau (theo thứ tự):

   ```
   1. Newtonsoft.Json (13.0.3)
   2. EntityFramework (6.4.4)
   3. System.Data.SQLite (1.0.118.0)
   4. System.Data.SQLite.Core (1.0.118.0)
   5. System.Data.SQLite.EF6 (1.0.118.0)
   6. Microsoft.AspNet.WebApi (5.2.9)
   7. Microsoft.AspNet.WebApi.Client (5.2.9)
   8. Microsoft.AspNet.WebApi.Core (5.2.9)
   9. Microsoft.AspNet.WebApi.WebHost (5.2.9)
   10. Microsoft.AspNet.Cors (5.2.9)
   11. Microsoft.AspNet.WebApi.Cors (5.2.9)
   12. BCrypt.Net-Next (4.0.3)
   ```

3. Chờ từng package được cài đặt xong

---

## Bước 3: Kiểm Tra References

Sau khi restore packages, kiểm tra trong **Solution Explorer**:

1. Mở **References** của project `QuanLiQuanHeXaHoi`
2. Phải có các DLL sau (KHÔNG có dấu ⚠️ vàng):
   ```
   - System.Web.Http
   - System.Web.Http.WebHost
   - System.Net.Http.Formatting
   - EntityFramework
   - System.Data.SQLite
   - System.Data.SQLite.EF6
   - Newtonsoft.Json
   - BCrypt.Net-Next
   ```

❌ **Nếu có dấu ⚠️ vàng**: References bị lỗi
   - Chuột phải vào reference bị lỗi → **Remove**
   - Restart Visual Studio
   - Restore packages lại (Bước 2)

---

## Bước 4: Clean & Rebuild

1. Chọn menu:
   ```
   Build → Clean Solution
   ```
2. Đợi clean xong, sau đó:
   ```
   Build → Rebuild Solution
   ```
3. Xem **Output** window để check lỗi

✅ **Thành công**: "Build succeeded. 0 failed"
❌ **Thất bại**: Xem phần "Common Build Errors" bên dưới

---

## Bước 5: Chạy Project

1. Đảm bảo `QuanLiQuanHeXaHoi` là **Startup Project** (in đậm)
   - Nếu không, chuột phải → **Set as Startup Project**
2. Nhấn **F5** hoặc **Ctrl+F5**
3. Trình duyệt sẽ mở tại: `http://localhost:47491/login.html`

---

## Common Build Errors & Solutions

### Lỗi 1: CS0234 - "The type or namespace name 'Http' does not exist in the namespace 'System.Web'"

**Nguyên nhân**: Thiếu `System.Web.Http` reference

**Giải pháp**:
```powershell
# Package Manager Console
Install-Package Microsoft.AspNet.WebApi -Version 5.2.9
```

Sau đó rebuild.

---

### Lỗi 2: CS0246 - "The type or namespace name 'BCrypt' could not be found"

**Nguyên nhân**: Thiếu BCrypt.Net-Next

**Giải pháp**:
```powershell
# Package Manager Console
Install-Package BCrypt.Net-Next -Version 4.0.3
```

Trong các controller file, đảm bảo có:
```csharp
using BCrypt.Net;
```

---

### Lỗi 3: CS0246 - "The type or namespace name 'ApiController' could not be found"

**Nguyên nhân**: Thiếu Web API Core

**Giải pháp**:
```powershell
Install-Package Microsoft.AspNet.WebApi.Core -Version 5.2.9
```

Đảm bảo có using:
```csharp
using System.Web.Http;
```

---

### Lỗi 4: "Could not load file or assembly 'System.Data.SQLite.EF6'"

**Nguyên nhân**: SQLite native binaries thiếu

**Giải pháp**:
```powershell
Update-Package System.Data.SQLite.Core -reinstall
```

Sau đó copy thư mục `x86` và `x64` từ `packages\System.Data.SQLite.Core.1.0.118.0\build\net461\` vào thư mục `bin\` của project.

---

### Lỗi 5: "The EntityFramework package is not installed"

**Giải pháp**:
```powershell
Install-Package EntityFramework -Version 6.4.4
```

---

## Troubleshooting: Nếu Project Là .NET Core

Nếu sau khi check Properties thấy project là `.NET 6/7/8` (ASP.NET Core), có 2 lựa chọn:

### Option 1: Tạo lại project .NET Framework (Khuyến nghị cho code hiện tại)

1. **File** → **New** → **Project**
2. Chọn **ASP.NET Web Application (.NET Framework)**
3. Chọn template: **Web API**
4. Framework: **.NET Framework 4.6.1**
5. Copy tất cả file code hiện tại sang project mới
6. Follow các bước 1-5 ở trên

### Option 2: Chuyển code sang ASP.NET Core (Nhiều công việc hơn)

Cần sửa code:
- Thay `System.Web.Http` → `Microsoft.AspNetCore.Mvc`
- Thay `ApiController` → `ControllerBase`
- Thay `IHttpActionResult` → `IActionResult`
- Bỏ `WebApiConfig.cs`, cấu hình trong `Program.cs`
- Thay Entity Framework 6 → Entity Framework Core

---

## Kiểm Tra Sau Khi Build Thành Công

1. **Database tự động tạo**:
   - Sau khi chạy lần đầu, check folder `App_Data`
   - Phải có file: `SocialRelationships.db`

2. **Test API endpoints**:
   - Mở Postman hoặc browser
   - Truy cập: `http://localhost:47491/api/auth/register`
   - Nếu không lỗi 404 → API hoạt động

3. **Test Login Page**:
   - Mở: `http://localhost:47491/login.html`
   - Phải hiển thị trang đăng nhập/đăng ký

---

## Checklist Trước Khi Chạy

- [ ] Project type là .NET Framework 4.6.1
- [ ] Tất cả NuGet packages đã được restore
- [ ] Không có references bị lỗi (⚠️ vàng)
- [ ] Build succeeded (0 failed)
- [ ] Web.config có connection string SQLite
- [ ] packages.config có đầy đủ 12+ packages

---

## Liên Hệ

Nếu vẫn gặp lỗi sau khi làm theo hướng dẫn:

1. Chụp màn hình **Error List** window
2. Chụp màn hình **Output** window
3. Gửi về để được hỗ trợ

---

**Good luck! 🚀**
