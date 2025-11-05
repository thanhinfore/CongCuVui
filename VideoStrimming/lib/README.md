# FFmpeg Core Files

Thư mục này chứa các file FFmpeg Core cần thiết cho VideoStrimming.

## 🚀 Cách Tải Nhanh

### Option 1: Sử dụng Script Tự Động (Khuyến Nghị)

Từ thư mục `VideoStrimming`, chạy:

```bash
chmod +x download-ffmpeg-local.sh
./download-ffmpeg-local.sh
```

Script sẽ tự động tải tất cả các file cần thiết vào thư mục này.

### Option 2: Tải Thủ Công

Nếu script không hoạt động, tải các file sau về thư mục `lib/`:

1. **ffmpeg-core.js** (~50-100KB)
   - https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js
   - Hoặc: https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js

2. **ffmpeg-core.wasm** (~32MB)
   - https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm
   - Hoặc: https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm

3. **ffmpeg-core.worker.js** (~10-20KB)
   - https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.worker.js
   - Hoặc: https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.worker.js

## 📋 Hướng Dẫn Chi Tiết

Xem file `HUONG_DAN.md` để biết thêm chi tiết về cách cài đặt và xử lý lỗi.

## ℹ️ Lưu Ý

- Tổng dung lượng: ~32-33MB
- Các file này được gitignore (không commit lên repo)
- Nếu không có các file local, app sẽ fallback sang CDN (có thể gặp lỗi CORS)
- Chỉ cần download một lần
