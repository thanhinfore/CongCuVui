# VideoStrimming 🎬

Ứng dụng web tự động cắt bỏ khoảng lặng trong video MP4 bằng FFmpeg.wasm.

## ✨ Tính Năng

- 🎥 Upload video MP4
- 🔇 Tự động phát hiện và loại bỏ khoảng lặng
- ⚙️ Tùy chỉnh ngưỡng âm thanh và khoảng lặng tối thiểu
- 💾 Download video đã được xử lý
- 🌐 Chạy hoàn toàn trên trình duyệt (không cần server)

## 🚀 Cài Đặt và Chạy

### Bước 1: Download FFmpeg Files

Ứng dụng cần các file FFmpeg core để hoạt động. Chạy script tự động:

```bash
cd VideoStrimming
chmod +x download-ffmpeg-local.sh
./download-ffmpeg-local.sh
```

**Lưu ý:** Nếu script không hoạt động, xem hướng dẫn tải thủ công trong `lib/README.md` hoặc `lib/HUONG_DAN.md`.

### Bước 2: Chạy Local Server

Bạn cần chạy local server để tránh lỗi CORS:

**Option 1: Python**
```bash
python3 -m http.server 8000
```

**Option 2: Node.js**
```bash
npx serve .
```

**Option 3: PHP**
```bash
php -S localhost:8000
```

### Bước 3: Truy Cập Ứng Dụng

Mở trình duyệt và truy cập:
```
http://localhost:8000
```

## 📖 Cách Sử Dụng

1. **Chọn video:** Click "Chọn tệp MP4" và chọn video cần xử lý
2. **Xử lý:** Click "Bắt đầu xử lý" và đợi
3. **Kết quả:** Xem video trước/sau và tải về nếu hài lòng

## 🔧 Cấu Hình

Các tham số có thể điều chỉnh trong `script.js`:

```javascript
const marginSeconds = 0.5;           // Giữ 0.5s trước/sau mỗi đoạn có tiếng
const silenceThreshold = '-35dB';    // Ngưỡng âm thanh coi là "lặng"
const minSilenceDuration = 0.5;      // Khoảng lặng tối thiểu để loại bỏ
```

## 🐛 Xử Lý Lỗi

### Lỗi: "Failed to construct 'Worker': Script cannot be accessed from origin"

**Nguyên nhân:** Chạy file HTML trực tiếp (file://) hoặc thiếu file FFmpeg local.

**Giải pháp:**
1. Chạy local server (xem Bước 2 ở trên)
2. Download FFmpeg files vào thư mục `lib/`

### Lỗi: "Failed to fetch" khi load FFmpeg

**Nguyên nhân:** Thiếu file FFmpeg local và không có kết nối internet hoặc bị chặn CDN.

**Giải pháp:**
Tải file FFmpeg về local bằng script `download-ffmpeg-local.sh` hoặc tải thủ công theo hướng dẫn trong `lib/HUONG_DAN.md`.

### Lỗi: 404 favicon.ico

**Giải pháp:** Đã được sửa! Favicon SVG đã được thêm vào.

## 📁 Cấu Trúc Dự Án

```
VideoStrimming/
├── index.html                    # Giao diện chính
├── script.js                     # Logic xử lý video
├── styles.css                    # CSS styling
├── favicon.svg                   # Icon trang web
├── download-ffmpeg-local.sh      # Script tự động tải FFmpeg
├── README.md                     # File này
└── lib/
    ├── README.md                 # Hướng dẫn FFmpeg
    ├── HUONG_DAN.md             # Hướng dẫn chi tiết
    ├── .gitignore               # Ignore FFmpeg files
    ├── ffmpeg-core.js           # (download riêng)
    ├── ffmpeg-core.wasm         # (download riêng)
    └── ffmpeg-core.worker.js    # (download riêng)
```

## 🛠️ Công Nghệ

- [FFmpeg.wasm](https://ffmpegwasm.netlify.app/) - FFmpeg compiled to WebAssembly
- Vanilla JavaScript (ES6 modules)
- HTML5 Video API

## 📝 License

MIT

## 👤 Tác Giả

[Tên của bạn]

## 🤝 Đóng Góp

Mọi đóng góp đều được chào đón! Hãy tạo issue hoặc pull request.
