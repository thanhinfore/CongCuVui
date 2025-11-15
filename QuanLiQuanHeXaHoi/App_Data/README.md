# App_Data Folder

## Mục Đích

Thư mục này chứa SQLite database file của ứng dụng.

## Files

- **SocialRelationships.db** - SQLite database (tự động tạo khi chạy lần đầu)
- **SocialRelationships.db-shm** - Shared memory file (SQLite WAL mode)
- **SocialRelationships.db-wal** - Write-Ahead Log file

## Lưu Ý

⚠️ **QUAN TRỌNG**:
- Thư mục này cần quyền **write** để tạo và cập nhật database
- Nếu chạy bằng IIS, đảm bảo IIS App Pool có quyền write
- Database files **KHÔNG** nên commit lên Git (đã ignore trong .gitignore)

## Quyền (Permissions)

Nếu gặp lỗi "Unable to open database file":

### Windows
```powershell
icacls "App_Data" /grant Users:F
```

### IIS
Cấp quyền cho IIS App Pool:
```powershell
icacls "App_Data" /grant "IIS AppPool\DefaultAppPool":F
```

## Backup

Để backup database, chỉ cần copy file `.db`:

```powershell
copy App_Data\SocialRelationships.db App_Data\SocialRelationships.backup.db
```

## Khôi Phục (Restore)

Để khôi phục từ backup:

```powershell
copy App_Data\SocialRelationships.backup.db App_Data\SocialRelationships.db
```

---

**Database sẽ tự động khởi tạo khi chạy ứng dụng lần đầu tiên.**
