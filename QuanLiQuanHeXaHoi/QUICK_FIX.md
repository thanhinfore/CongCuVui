# ⚡ QUICK FIX - Giải Quyết Lỗi Build Ngay

## Lỗi Hiện Tại
```
CS0234: The type or namespace name 'Http' does not exist in the namespace 'System.Web'
CS0246: The type or namespace name 'BCrypt' could not be found
CS0246: The type or namespace name 'ApiController' could not be found
...và nhiều lỗi tương tự
```

**Nguyên nhân**: NuGet packages chưa được restore (download về máy).

---

## ✅ GIẢI PHÁP NHANH NHẤT

### Bước 1: Mở Package Manager Console

Trong Visual Studio:
```
Tools → NuGet Package Manager → Package Manager Console
```

### Bước 2: Chạy Lệnh Restore

Copy và paste lệnh này vào console:

```powershell
Update-Package -reinstall -Project QuanLiQuanHeXaHoi
```

**Hoặc** nếu lệnh trên lỗi, thử:

```powershell
Install-Package Microsoft.AspNet.WebApi -Version 5.2.9 -Project QuanLiQuanHeXaHoi
Install-Package Microsoft.AspNet.WebApi.Core -Version 5.2.9 -Project QuanLiQuanHeXaHoi
Install-Package Microsoft.AspNet.WebApi.WebHost -Version 5.2.9 -Project QuanLiQuanHeXaHoi
Install-Package Microsoft.AspNet.WebApi.Cors -Version 5.2.9 -Project QuanLiQuanHeXaHoi
Install-Package EntityFramework -Version 6.4.4 -Project QuanLiQuanHeXaHoi
Install-Package System.Data.SQLite -Version 1.0.118.0 -Project QuanLiQuanHeXaHoi
Install-Package System.Data.SQLite.EF6 -Version 1.0.118.0 -Project QuanLiQuanHeXaHoi
Install-Package BCrypt.Net-Next -Version 4.0.3 -Project QuanLiQuanHeXaHoi
Install-Package Newtonsoft.Json -Version 13.0.3 -Project QuanLiQuanHeXaHoi
```

### Bước 3: Đợi Packages Download

Sẽ mất 1-2 phút. Bạn sẽ thấy output như:
```
Installing 'Microsoft.AspNet.WebApi 5.2.9'...
Successfully installed 'Microsoft.AspNet.WebApi 5.2.9'...
Adding 'Microsoft.AspNet.WebApi 5.2.9' to QuanLiQuanHeXaHoi...
Successfully added 'Microsoft.AspNet.WebApi 5.2.9' to QuanLiQuanHeXaHoi
```

### Bước 4: Kiểm Tra References

Sau khi restore xong:

1. Trong **Solution Explorer**, mở **References** của project `QuanLiQuanHeXaHoi`
2. Kiểm tra phải có (KHÔNG có ⚠️ vàng):
   - ✅ System.Web.Http
   - ✅ System.Web.Http.WebHost
   - ✅ System.Net.Http.Formatting
   - ✅ EntityFramework
   - ✅ System.Data.SQLite
   - ✅ BCrypt.Net-Next
   - ✅ Newtonsoft.Json

### Bước 5: Clean & Rebuild

```
Build → Clean Solution
Build → Rebuild Solution
```

**Kết quả mong đợi**: `Build succeeded. 0 failed`

---

## ⚠️ Nếu Vẫn Lỗi

### Kiểm tra 1: NuGet Package Manager Settings

```
Tools → Options → NuGet Package Manager → General
```

Đảm bảo check:
- ✅ "Allow NuGet to download missing packages"
- ✅ "Automatically check for missing packages during build"

Click **OK** và thử lại.

### Kiểm tra 2: Project Target Framework

1. Chuột phải project → **Properties**
2. Tab **Application**
3. **Target framework** phải là: `.NET Framework 4.6.1` (hoặc 4.7.2, 4.8)
4. KHÔNG được là `.NET 6`, `.NET 7`, `.NET 8`

Nếu sai framework:
- Đổi về `.NET Framework 4.6.1`
- Rebuild project

### Kiểm tra 3: Xóa thư mục packages cũ

Đôi khi packages bị corrupt. Thử:

1. Đóng Visual Studio
2. Xóa thư mục `packages` ở thư mục solution
   ```
   C:\2025-projects\CongCuVui\packages\
   ```
3. Mở lại Visual Studio
4. Chuột phải Solution → **Restore NuGet Packages**
5. Rebuild

---

## 🚀 Alternative: Dùng nuget.exe (Command Line)

Nếu Visual Studio không restore được, dùng command line:

1. Download NuGet.exe:
   ```
   https://dist.nuget.org/win-x86-commandline/latest/nuget.exe
   ```

2. Copy `nuget.exe` vào thư mục solution

3. Mở Command Prompt tại thư mục project:
   ```cmd
   cd C:\2025-projects\CongCuVui\QuanLiQuanHeXaHoi
   ..\nuget.exe restore QuanLiQuanHeXaHoi.csproj -PackagesDirectory ..\packages
   ```

4. Mở lại Visual Studio và build

---

## 📝 Checklist Sau Khi Fix

- [ ] Tất cả packages đã được installed (check Package Manager Console output)
- [ ] References không có ⚠️ vàng
- [ ] `System.Web.Http.dll` có trong References
- [ ] `BCrypt.Net-Next.dll` có trong References
- [ ] Build succeeded (0 errors)

---

## 🆘 Vẫn Không Work?

Thử cách cuối cùng - **Tạo lại project**:

1. **File** → **New** → **Project**
2. Chọn **ASP.NET Web Application (.NET Framework)**
3. Tên project: `QuanLiQuanHeXaHoi_New`
4. Framework: **.NET Framework 4.6.1**
5. Template: **Web API**
6. Click **Create**

Sau đó:
- Copy tất cả files code từ project cũ sang project mới
- Copy `packages.config` sang
- Restore packages
- Build

Project template Web API đã có sẵn tất cả references cần thiết.

---

**Hãy thử Giải pháp nhanh nhất (Bước 1-5) trước!**

Trong 90% trường hợp, chạy `Update-Package -reinstall` sẽ fix tất cả lỗi này.
