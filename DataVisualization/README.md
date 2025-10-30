# TimeSeriesRacing - Web Edition

Phiên bản web-based của TimeSeriesRacing, cho phép tạo animated racing charts trực tiếp trong trình duyệt mà không cần cài đặt Python hay bất kỳ dependencies nào!

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-web-orange)

## ✨ Tính năng

### 🎯 Core Features
- ✅ **Upload CSV** - Kéo thả hoặc chọn file CSV
- ✅ **Auto-detect Format** - Tự động nhận diện format LONG hoặc WIDE
- ✅ **Bar Chart Racing** - Animation đua thanh ngang mượt mà
- ✅ **Real-time Preview** - Xem trước dữ liệu và cấu hình
- ✅ **Video Export** - Xuất video WebM trực tiếp trong browser
- ✅ **Multiple Palettes** - 7 bảng màu đẹp (vibrant, neon, gold, ocean, sunset, professional, pastel)
- ✅ **Responsive Design** - Hoạt động tốt trên mọi kích thước màn hình
- ✅ **Zero Installation** - Chỉ cần trình duyệt web!

### 🎨 Customization Options
- Tùy chỉnh tiêu đề và subtitle
- Chọn số lượng items hiển thị (Top 5-20)
- Điều chỉnh tốc độ animation (200-3000ms)
- Chọn frame rate (30fps hoặc 60fps)
- 7 color palettes chuyên nghiệp

## 🚀 Quick Start

### Cách 1: Mở trực tiếp file HTML

```bash
# Mở file index.html trong trình duyệt
open index.html  # macOS
start index.html # Windows
xdg-open index.html # Linux
```

### Cách 2: Chạy Local Web Server

```bash
# Sử dụng Python
python -m http.server 8000

# Hoặc sử dụng Node.js
npx http-server -p 8000

# Sau đó mở: http://localhost:8000
```

### Cách 3: Deploy lên GitHub Pages

1. Push code lên GitHub repository
2. Vào Settings → Pages
3. Chọn branch và folder root
4. Truy cập tại: `https://username.github.io/repository-name`

## 📖 Hướng dẫn sử dụng

### Bước 1: Upload Data

**Option A: Sử dụng Sample Data**
- Click nút "Load Sample Data" để load dữ liệu mẫu về Programming Languages

**Option B: Upload CSV File**
- Click vào upload box hoặc kéo thả file CSV
- Hỗ trợ 2 định dạng:

**Format 1: LONG Format** (3 cột: time, entity, value)
```csv
year,language,popularity
1990,Python,5
1990,Java,80
1990,C++,90
1995,Python,15
1995,Java,85
```

**Format 2: WIDE Format** (nhiều cột: time, entity1, entity2, ...)
```csv
year,Python,Java,C++,JavaScript
1990,5,80,90,0
1995,15,85,80,5
2000,30,90,70,20
```

### Bước 2: Configure

Điều chỉnh các tham số:
- **Title**: Tiêu đề của chart
- **Top N items**: Số lượng items hiển thị (5-20)
- **Frame Rate**: 30fps (standard) hoặc 60fps (smooth)
- **Animation Speed**: Tốc độ chuyển đổi giữa các periods (ms)
- **Color Palette**: Chọn bảng màu yêu thích

### Bước 3: Play Animation

- Click **▶️ Play** để chạy animation
- Click **⏸️ Pause** để tạm dừng
- Click **⏮️ Reset** để reset về đầu

### Bước 4: Export Video

- Click **💾 Export Video (WebM)**
- Đợi animation chạy xong
- Video sẽ tự động download (format: WebM)

## 📁 Cấu trúc Project

```
DataVisualization/
├── index.html              # Main entry point
├── README.md              # This file
├── css/
│   └── main.css          # Styles (responsive, modern design)
├── js/
│   ├── app.js            # Main application orchestrator
│   └── modules/
│       ├── dataHandler.js      # CSV parsing & normalization
│       ├── chartEngine.js      # Chart.js integration
│       └── animationEngine.js  # GSAP animation control
└── examples/
    └── sample.csv        # Sample dataset
```

## 🎨 Color Palettes

| Palette | Description | Best For |
|---------|-------------|----------|
| **vibrant** | Bright, energetic colors | General purpose, social media |
| **professional** | Subtle, business-friendly | Presentations, reports |
| **neon** | High-contrast neon colors | TikTok, trending content |
| **gold** | Warm gold/orange tones | Premium content, luxury |
| **ocean** | Blue/teal gradient | Technology, science |
| **sunset** | Orange/red gradient | Nature, travel |
| **pastel** | Soft pastel colors | Aesthetic, Instagram |

## 🛠 Technology Stack

### Core Libraries (via CDN)
- **PapaParse 5.4.1** - CSV parsing (~35KB)
- **Chart.js 4.4.0** - Chart rendering (~200KB)
- **GSAP 3.12.2** - Animation engine (~50KB)

### Native Browser APIs
- **Canvas API** - Chart rendering
- **MediaRecorder API** - Video recording (WebM)
- **File API** - File upload

**Total size: ~285KB** (very lightweight!)

## 🌐 Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome 90+ | ✅ Full | Recommended |
| Firefox 88+ | ✅ Full | Good performance |
| Safari 14+ | ⚠️ Partial | WebM export might need polyfill |
| Edge 90+ | ✅ Full | Chromium-based |
| Mobile Chrome | ✅ Full | Works on Android |
| Mobile Safari | ⚠️ Partial | iOS has MediaRecorder limitations |

**Note**: Nếu Safari/iOS không support WebM export, có thể:
1. Sử dụng Chrome/Firefox thay thế
2. Hoặc implement server-side conversion (FFmpeg)

## 📊 Sample Datasets

Thư mục `examples/` chứa các dataset mẫu:

- `sample.csv` - Programming Languages Popularity (1990-2020)

Bạn có thể sử dụng thêm các dataset từ:
- [TimeSeriesRacing/examples/](../TimeSeriesRacing/examples/) - 25+ sports datasets
- [Kaggle](https://www.kaggle.com/datasets) - Thousands of datasets
- [Our World in Data](https://ourworldindata.org/) - World statistics

## 🔧 Advanced Configuration

### Custom Canvas Size

Mặc định: 1920x1080 (Full HD)

Để thay đổi, edit trong `js/app.js`:

```javascript
getConfig() {
    return {
        // ... other config
        width: 3840,  // 4K width
        height: 2160  // 4K height
    };
}
```

### Custom Color Palette

Thêm palette mới trong `js/modules/chartEngine.js`:

```javascript
getColorPalette(paletteName) {
    const palettes = {
        // ... existing palettes
        myCustomPalette: [
            '#FF0000', '#00FF00', '#0000FF',
            '#FFFF00', '#FF00FF', '#00FFFF'
        ]
    };
    // ...
}
```

### Adjust Animation Easing

Trong `js/modules/animationEngine.js`:

```javascript
this.timeline.to(this, {
    duration: periodDuration,
    ease: 'power2.inOut', // Change to: 'linear', 'elastic', 'bounce', etc.
    // ...
});
```

GSAP Easing options: https://greensock.com/docs/v3/Eases

## 🚧 Roadmap

### Phase 1 (Current - MVP)
- ✅ Bar chart racing
- ✅ CSV upload & auto-detection
- ✅ WebM video export
- ✅ 7 color palettes
- ✅ Responsive UI

### Phase 2 (Next Sprint)
- ⏳ Line chart racing
- ⏳ Pie chart racing
- ⏳ Column chart racing
- ⏳ Combo mode (multiple charts)
- ⏳ Stats panel overlay
- ⏳ Progress bar

### Phase 3 (Future)
- ⏳ Excel file support (.xlsx)
- ⏳ MP4 export (via server-side FFmpeg)
- ⏳ Event annotations
- ⏳ Watermark/branding
- ⏳ Real-time data streaming
- ⏳ Mobile app (PWA)

## 🐛 Known Issues

1. **Safari WebM Export**: Safari có giới hạn về MediaRecorder API
   - Workaround: Sử dụng Chrome hoặc Firefox

2. **Large Datasets**: Datasets với >10,000 rows có thể gây lag
   - Workaround: Giảm số lượng entities hoặc periods

3. **Mobile Performance**: Animation có thể chậm trên thiết bị cũ
   - Workaround: Giảm FPS xuống 30 hoặc tăng animation speed

## 📝 So sánh với Python Version

| Feature | Python CLI | Web Version |
|---------|-----------|-------------|
| **Installation** | Python, pip, FFmpeg | None (browser only) |
| **Platform** | Desktop only | Any device with browser |
| **Sharing** | Send file/video | Send URL |
| **Export Format** | MP4 (H.264) | WebM (VP9) |
| **Dataset Size** | Unlimited | Limited by browser memory |
| **Chart Types** | 5 types (bar, line, pie, column, combo) | 1 type (bar) - more coming |
| **Features** | Full (40+ options) | MVP (core features) |
| **Use Case** | Power users, batch processing | Quick demos, sharing |

**Recommendation**:
- Dùng **Web version** cho quick demos, sharing, mobile usage
- Dùng **Python version** cho production, large datasets, MP4 export

## 🤝 Contributing

Contributions are welcome!

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](../LICENSE) file for details

## 👨‍💻 Author

**thanhinfore**
- GitHub: [@thanhinfore](https://github.com/thanhinfore)
- Repository: [CongCuVui](https://github.com/thanhinfore/CongCuVui)

## 🙏 Acknowledgments

- [Chart.js](https://www.chartjs.org/) - Amazing chart library
- [GSAP](https://greensock.com/gsap/) - Professional-grade animation
- [PapaParse](https://www.papaparse.com/) - Best CSV parser for JavaScript
- [TimeSeriesRacing Python](../TimeSeriesRacing/) - Original inspiration

## 📧 Support

If you have any questions or issues:
1. Check [Issues](https://github.com/thanhinfore/CongCuVui/issues)
2. Create a new issue with detailed description
3. Or contact via GitHub

---

Made with ❤️ using HTML, JavaScript, and CSS

**Star ⭐ this repo if you find it useful!**
