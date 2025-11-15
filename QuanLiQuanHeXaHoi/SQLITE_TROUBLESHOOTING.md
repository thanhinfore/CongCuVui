# SQLite Entity Framework Troubleshooting

## Lỗi: "No Entity Framework provider found for the ADO.NET provider"

### Mô Tả Lỗi

```
System.InvalidOperationException: No Entity Framework provider found for the ADO.NET provider with invariant name 'System.Data.SQLite'.
Make sure the provider is registered in the 'entityFramework' section of the application config file.
```

**Nguyên nhân**: Entity Framework không tìm thấy SQLite provider khi khởi tạo database.

---

## ✅ Giải Pháp Đã Áp Dụng

### 1. SQLiteConfiguration Class

Đã tạo class `SQLiteConfiguration` trong `Data/AppDbContext.cs`:

```csharp
public class SQLiteConfiguration : DbConfiguration
{
    public SQLiteConfiguration()
    {
        SetProviderFactory("System.Data.SQLite", System.Data.SQLite.SQLiteFactory.Instance);
        SetProviderFactory("System.Data.SQLite.EF6", System.Data.SQLite.EF6.SQLiteProviderFactory.Instance);
        SetProviderServices("System.Data.SQLite", System.Data.SQLite.EF6.SQLiteProviderServices.Instance);
        SetProviderServices("System.Data.SQLite.EF6", System.Data.SQLite.EF6.SQLiteProviderServices.Instance);
    }
}
```

### 2. DbConfigurationType Attribute

Thêm attribute vào `AppDbContext`:

```csharp
[DbConfigurationType(typeof(SQLiteConfiguration))]
public class AppDbContext : DbContext
{
    // ...
}
```

### 3. Web.config Đã Có Đầy Đủ

```xml
<entityFramework>
  <providers>
    <provider invariantName="System.Data.SQLite.EF6"
              type="System.Data.SQLite.EF6.SQLiteProviderServices, System.Data.SQLite.EF6" />
  </providers>
</entityFramework>

<system.data>
  <DbProviderFactories>
    <add name="SQLite Data Provider (Entity Framework 6)"
         invariant="System.Data.SQLite.EF6"
         type="System.Data.SQLite.EF6.SQLiteProviderFactory, System.Data.SQLite.EF6" />
  </DbProviderFactories>
</system.data>
```

---

## 🔧 Nếu Vẫn Gặp Lỗi

### Kiểm tra 1: Packages Đã Cài Đủ Chưa?

Đảm bảo có đầy đủ packages trong `References`:

```
✅ System.Data.SQLite
✅ System.Data.SQLite.Core
✅ System.Data.SQLite.EF6
✅ System.Data.SQLite.Linq
✅ EntityFramework
```

Nếu thiếu, restore lại:
```powershell
Update-Package -reinstall -Project QuanLiQuanHeXaHoi
```

### Kiểm tra 2: Native Binaries

SQLite cần native binaries (x86/x64). Kiểm tra thư mục bin:

```
bin/
├── x86/
│   └── SQLite.Interop.dll
└── x64/
    └── SQLite.Interop.dll
```

Nếu thiếu:
1. Rebuild project
2. Hoặc copy từ `packages\System.Data.SQLite.Core.x.x.x\build\net461\`

### Kiểm tra 3: App_Data Folder

Đảm bảo thư mục `App_Data` tồn tại và có quyền write:

```powershell
# Tạo thư mục nếu chưa có
mkdir App_Data
```

### Kiểm tra 4: Connection String

Connection string trong Web.config phải đúng:

```xml
<add name="DefaultConnection"
     connectionString="Data Source=|DataDirectory|\SocialRelationships.db;Version=3;"
     providerName="System.Data.SQLite.EF6" />
```

**Lưu ý**: `|DataDirectory|` sẽ map vào `App_Data` folder.

---

## 🚨 Lỗi Khác Liên Quan SQLite

### Lỗi: "Unable to load DLL 'SQLite.Interop.dll'"

**Nguyên nhân**: Native SQLite library thiếu hoặc wrong architecture (x86/x64).

**Giải pháp**:

1. **Cách 1**: Rebuild project (Visual Studio sẽ tự copy)

2. **Cách 2**: Cài lại SQLite.Core package
   ```powershell
   Update-Package System.Data.SQLite.Core -reinstall
   ```

3. **Cách 3**: Copy thủ công
   - Từ: `packages\System.Data.SQLite.Core.1.0.118.0\build\net461\`
   - Vào: `bin\`
   - Đảm bảo có cả folder `x86` và `x64`

### Lỗi: "Database is locked"

**Nguyên nhân**: Có nhiều connections mở cùng lúc.

**Giải pháp**:

1. Đảm bảo dispose DbContext:
   ```csharp
   using (var context = new AppDbContext())
   {
       // Your code
   } // Tự động dispose
   ```

2. Thêm vào connection string:
   ```xml
   connectionString="Data Source=|DataDirectory|\SocialRelationships.db;Version=3;Journal Mode=WAL;"
   ```

### Lỗi: "Unable to open the database file"

**Nguyên nhân**: Permission issue với App_Data folder.

**Giải pháp**:

1. Run Visual Studio as Administrator
2. Hoặc cấp quyền full control cho folder:
   ```powershell
   icacls "C:\path\to\project\App_Data" /grant Users:F
   ```

---

## 📝 Checklist Trước Khi Chạy

- [ ] Tất cả SQLite packages đã được cài đặt
- [ ] References không có warning (⚠️)
- [ ] Thư mục `App_Data` đã tồn tại
- [ ] `SQLite.Interop.dll` có trong `bin/x86` và `bin/x64`
- [ ] `SQLiteConfiguration` class có trong `AppDbContext.cs`
- [ ] `[DbConfigurationType]` attribute đã được thêm
- [ ] Web.config có đầy đủ entityFramework và system.data sections
- [ ] Build succeeded (0 errors)

---

## 🎯 Kết Quả Mong Đợi

Sau khi fix:

1. **Chạy project** (F5)
2. **App_Start** thành công
3. **Database tự động tạo**:
   - File: `App_Data\SocialRelationships.db`
   - Size: ~16 KB (empty database)
4. **Trình duyệt mở**: `http://localhost:47491/login.html`
5. **Không có lỗi** trong browser console

---

## 📚 Tài Liệu Tham Khảo

- [SQLite EF6 Provider Documentation](https://system.data.sqlite.org/index.html/doc/trunk/www/index.wiki)
- [Entity Framework Code First](https://learn.microsoft.com/en-us/ef/ef6/)
- [DbConfiguration Class](https://learn.microsoft.com/en-us/dotnet/api/system.data.entity.dbconfiguration)

---

**Nếu vẫn gặp vấn đề, hãy kiểm tra:**
1. Output window trong Visual Studio
2. Windows Event Viewer
3. IIS Express logs

Good luck! 🚀
