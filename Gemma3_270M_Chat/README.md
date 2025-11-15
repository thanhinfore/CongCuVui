# Gemma 3 270M Chat 💬

Ứng dụng chat AI chạy hoàn toàn trên trình duyệt, sử dụng mô hình Gemma 3 270M được tải trực tiếp vào browser của người dùng.

## ✨ Tính năng

- 🚀 **Chạy hoàn toàn trên trình duyệt** - Không cần server, dữ liệu luôn được bảo mật
- 🤖 **Mô hình Gemma 3 270M** - Sử dụng Gemma 3 270M IT ONNX (optimized cho browser)
- 💾 **Lưu trữ lịch sử chat** - Tự động lưu vào IndexedDB
- 🎨 **Giao diện đẹp mắt** - Dark mode, responsive, animations mượt mà
- ⚙️ **Tùy chỉnh linh hoạt** - Temperature, Top-P, Max Tokens, System Prompt
- 📱 **Responsive** - Hoạt động tốt trên desktop và mobile
- 🔄 **Real-time streaming** - Hiển thị từng từ khi AI tạo phản hồi
- 🌐 **WebGPU/WASM** - Tự động chọn device tối ưu (GPU nếu có)

## 🏗️ Kiến trúc

```
Gemma3_270M_Chat/
├── index.html              # Giao diện chính
├── css/
│   ├── main.css           # Styles chính, dark mode, layout
│   └── chat.css           # Styles cho chat interface
├── js/
│   ├── app.js             # Entry point, khởi tạo app
│   ├── modules/
│   │   ├── model-loader.js    # Load và quản lý Gemma model
│   │   ├── chat-manager.js    # Quản lý chat flow
│   │   ├── ui-controller.js   # Xử lý UI interactions
│   │   ├── settings-manager.js # Quản lý settings
│   │   └── storage-manager.js  # IndexedDB storage
│   └── workers/
│       └── inference-worker.js # Web Worker cho model inference
└── README.md
```

## 🚀 Cách sử dụng

### 1. Chạy trực tiếp (Simple HTTP Server)

```bash
# Sử dụng Python
cd Gemma3_270M_Chat
python -m http.server 8000

# Hoặc sử dụng Node.js
npx http-server -p 8000

# Hoặc sử dụng PHP
php -S localhost:8000
```

Sau đó mở trình duyệt tại: `http://localhost:8000`

### 2. Deploy lên ASP.NET IIS

Dự án đã được cấu hình sẵn cho ASP.NET:
- Mở `Gemma3_270M_Chat.sln` trong Visual Studio
- Nhấn F5 hoặc Run để chạy với IIS Express

### 3. Sử dụng ứng dụng

1. **Lần đầu sử dụng**: Mô hình sẽ được tải xuống (~150MB), chờ đợi cho đến khi hiển thị "Mô hình đã sẵn sàng!"
2. **Nhập tin nhắn**: Gõ tin nhắn vào ô input và nhấn Enter hoặc nút gửi
3. **Xem phản hồi**: AI sẽ trả lời real-time với streaming
4. **Tùy chỉnh**: Click icon ⚙️ để điều chỉnh temperature, top-p, max tokens
5. **Dark mode**: Click icon 🌙 để chuyển đổi chế độ tối
6. **Xóa lịch sử**: Click icon 🗑️ để xóa toàn bộ lịch sử chat

## ⚙️ Cài đặt nâng cao

### Temperature (0-2)
- **Thấp (0-0.5)**: Phản hồi chính xác, tập trung
- **Trung bình (0.6-1.0)**: Cân bằng giữa sáng tạo và chính xác
- **Cao (1.1-2.0)**: Sáng tạo, ngẫu nhiên hơn

### Top P (0-1)
- **Thấp (0-0.5)**: Chọn từ trong tập hẹp
- **Trung bình (0.6-0.9)**: Cân bằng
- **Cao (0.9-1.0)**: Cho phép nhiều lựa chọn từ hơn

### Max Tokens (64-2048)
Số tokens tối đa trong phản hồi (~1 token ≈ 0.75 từ)

### System Prompt
Hướng dẫn chung cho AI về cách trả lời (role, style, format)

## 🔧 Công nghệ sử dụng

- **Frontend**: Vanilla JavaScript (ES6 Modules)
- **AI Model**: Gemma 2 2B IT via Transformers.js (@xenova/transformers)
- **Storage**: IndexedDB API
- **Workers**: Web Workers API
- **Styling**: CSS3 với CSS Variables, Flexbox, Grid
- **Fonts**: Google Fonts (Inter)
- **Backend**: ASP.NET Framework 4.6.1 (chỉ host static files)

## 📊 Yêu cầu hệ thống

### Trình duyệt hỗ trợ
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 15+

### Yêu cầu tối thiểu
- **RAM**: 2GB+ (khuyến nghị 4GB+)
- **Kết nối Internet**: Cần cho lần đầu tải model (~200-300MB)
- **Dung lượng lưu trữ**: ~400MB cho model cache

### Tính năng tùy chọn
- **WebGPU**: Tăng tốc inference (Chrome 113+, Edge 113+)
- **WASM**: Fallback nếu không có WebGPU

## 🐛 Xử lý lỗi

### Model không tải được
- Kiểm tra kết nối Internet
- Xóa cache browser và thử lại
- Kiểm tra console (F12) để xem lỗi chi tiết

### Phản hồi chậm
- Model đang chạy trên CPU (WASM) - bình thường với device không có GPU
- Giảm `max_tokens` để phản hồi nhanh hơn
- Sử dụng trình duyệt hỗ trợ WebGPU

### Lỗi Web Worker
- Đảm bảo ứng dụng chạy qua HTTP/HTTPS (không phải `file://`)
- Kiểm tra CORS nếu deploy lên server

## 📝 Changelog

### Version 1.0.0 (2025-11-15)
- ✨ Ra mắt phiên bản đầu tiên
- 🤖 Tích hợp Gemma 3 270M IT ONNX model
- 💬 Chat interface với streaming
- 💾 Lưu trữ lịch sử với IndexedDB
- 🎨 Dark mode
- ⚙️ Cài đặt linh hoạt
- 📱 Responsive design

## 🔮 Kế hoạch tương lai

- [ ] Hỗ trợ nhiều models khác nhau (Llama, Mistral, etc.)
- [ ] Export/Import chat history
- [ ] Markdown rendering trong messages
- [ ] Code syntax highlighting
- [ ] Voice input/output
- [ ] Multi-session management
- [ ] PWA support (offline mode)
- [ ] Model quantization options

## 📄 License

MIT License - Tự do sử dụng cho mọi mục đích

## 👨‍💻 Tác giả

Phát triển bởi Claude Code cho dự án CongCuVui

## 🙏 Credits

- [Transformers.js](https://github.com/xenova/transformers.js) - Hugging Face
- [Gemma Model](https://ai.google.dev/gemma) - Google
- [Inter Font](https://rsms.me/inter/) - Rasmus Andersson

---

**Lưu ý**: Ứng dụng sử dụng **Gemma 3 270M IT ONNX** (`onnx-community/gemma-3-270m-it-ONNX`) - model nhỏ gọn 270M parameters được Google phát hành tháng 8/2025, đã được tối ưu hóa ONNX cho browser với WebGPU support. Model có context window 32K tokens và vocabulary 256K tokens, phù hợp cho on-device AI tasks.
