# FFmpeg Core Files

Để sử dụng VideoStrimming với các file FFmpeg từ local, vui lòng tải các file sau về thư mục này:

## Các file cần thiết:

1. **ffmpeg-core.js**
2. **ffmpeg-core.wasm**
3. **ffmpeg-core.worker.js**

## Cách tải:

### Option 1: Tải trực tiếp từ unpkg.com

```bash
cd VideoStrimming/lib

# Tải ffmpeg-core.js
curl -L -o ffmpeg-core.js https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js

# Tải ffmpeg-core.wasm
curl -L -o ffmpeg-core.wasm https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm

# Tải ffmpeg-core.worker.js
curl -L -o ffmpeg-core.worker.js https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.worker.js
```

### Option 2: Tải từ jsdelivr.net

```bash
cd VideoStrimming/lib

# Tải ffmpeg-core.js
curl -L -o ffmpeg-core.js https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js

# Tải ffmpeg-core.wasm
curl -L -o ffmpeg-core.wasm https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm

# Tải ffmpeg-core.worker.js
curl -L -o ffmpeg-core.worker.js https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.worker.js
```

### Option 3: Tải thủ công

Truy cập các URL sau bằng trình duyệt và lưu file về:

- https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js
- https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm
- https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.worker.js

## Lưu ý:

- Nếu không có các file này, ứng dụng sẽ tự động fallback sang tải từ CDN
- Đảm bảo 3 file đều được đặt trong thư mục `VideoStrimming/lib/`
- Kích thước tổng cộng khoảng 30-35MB
