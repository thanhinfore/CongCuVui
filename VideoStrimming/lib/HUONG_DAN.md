# Hướng Dẫn Cài Đặt FFmpeg Local cho VideoStrimming

## Vấn Đề
Khi chạy VideoStrimming trên localhost, bạn gặp lỗi CORS do các file FFmpeg được load từ CDN. Để giải quyết, cần tải các file về local.

## Giải Pháp

### Bước 1: Chạy Script Download (Khuyến Nghị)

Từ thư mục `VideoStrimming`, chạy:

```bash
chmod +x download-ffmpeg-local.sh
./download-ffmpeg-local.sh
```

Script này sẽ tự động tải tất cả các file cần thiết vào thư mục `lib/`.

### Bước 2: Download Thủ Công (Nếu Script Không Hoạt Động)

Nếu script không hoạt động (do firewall/proxy), tải thủ công các file sau:

#### 2.1. Tải FFmpeg Core Files

Vào thư mục `VideoStrimming/lib/` và tải các file:

1. **ffmpeg-core.js**
   - URL: https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js
   - Hoặc: https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js

2. **ffmpeg-core.wasm** (~32MB)
   - URL: https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm
   - Hoặc: https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm

3. **ffmpeg-core.worker.js**
   - URL: https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.worker.js
   - Hoặc: https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.worker.js

#### 2.2. Cấu Trúc Thư Mục Sau Khi Hoàn Thành

```
VideoStrimming/
├── lib/
│   ├── ffmpeg-core.js
│   ├── ffmpeg-core.wasm
│   └── ffmpeg-core.worker.js
├── index.html
└── script.js
```

### Bước 3: Kiểm Tra

Sau khi tải xong, kiểm tra kích thước files:

```bash
ls -lh lib/
```

Bạn sẽ thấy:
- `ffmpeg-core.js`: ~50-100KB
- `ffmpeg-core.wasm`: ~31-33MB
- `ffmpeg-core.worker.js`: ~10-20KB

### Bước 4: Chạy Ứng Dụng

1. Mở terminal tại thư mục `VideoStrimming`
2. Chạy local server (ví dụ):
   ```bash
   python3 -m http.server 8000
   ```
   Hoặc:
   ```bash
   npx serve .
   ```

3. Truy cập: http://localhost:8000

## Xử Lý Lỗi

### Lỗi: "Access denied" khi tải file

Môi trường của bạn có thể bị chặn truy cập CDN. Sử dụng máy tính khác hoặc tắt proxy/firewall tạm thời.

### Lỗi: Files có kích thước 13 bytes

Các file không được tải đúng. Thử:
1. Sử dụng trình duyệt để tải thủ công
2. Kiểm tra kết nối internet
3. Thử CDN khác (jsdelivr thay vì unpkg)

### Lỗi: CORS vẫn xảy ra

Đảm bảo bạn đang chạy từ local server (http://localhost), không phải file:// protocol.

## Ghi Chú

- Tổng dung lượng: ~32-33MB
- Chỉ cần download một lần
- Các file này được cache nên lần sau sẽ load nhanh hơn
