# TimeSeriesRacing v3.0 - Ultra HD Bar Chart Race Videos

Công cụ Python đơn giản để tạo video "bar chart race" (biểu đồ động) từ dữ liệu time series - giống như các video "Evolution of Data" trên TikTok/YouTube.

**🆕 Version 3.0 - Ultra HD**: Nâng cấp lớn với DPI cao hơn, hiển thị giá trị trên bars, visual effects đẹp mắt, và chất lượng video vượt trội!

## ✨ Tính năng chính

### Core Features
- **Tự động nhận dạng** cấu trúc dữ liệu (long format / wide format)
- **Hỗ trợ nhiều định dạng**: CSV, Excel (.xlsx, .xls), JSON
- **Không cần setup phức tạp**: Chỉ 1 file Python duy nhất
- **CLI đơn giản**: Chạy ngay với 1 lệnh
- **Xuất video MP4** chất lượng cao

### 🆕 New in v3.0 (ULTRA HD)
- **Higher DPI (150 default, up to 300)**: Video chất lượng cao hơn gấp đôi v2.0
- **Bar Value Labels**: Hiển thị số trên mỗi bar (có thể tắt)
- **Enhanced Visual Effects**: Borders dày hơn, shadows, better styling
- **Better Typography**: Custom font families (sans-serif, serif, monospace)
- **Improved Bar Styling**: Better colors, alpha, edge colors
- **60fps Support**: Ultra smooth animations
- **Quality Control**: Full control over DPI, effects, bar values

### Features from v2.0
- **8 Color Palettes**: Vibrant, Professional, Neon, Pastel, Ocean, Sunset, Earth, Football
- **4 Style Presets**: TikTok, YouTube, Instagram, Presentation
- **Gradient Bar Styles**: Bars với gradient colors đẹp mắt
- **Enhanced Typography**: Font sizing tối ưu cho mỗi platform
- **Smooth Animations**: Tăng steps per period cho animation mượt mà hơn
- **Platform Optimization**: Auto-config cho TikTok, YouTube, Instagram
- **Professional Styling**: Bar borders, colors, spacing được tinh chỉnh

## Cài đặt

### 1. Cài đặt thư viện Python

```bash
pip install -r requirements.txt
```

Hoặc cài thủ công:

```bash
pip install pandas matplotlib bar_chart_race openpyxl
```

### 2. Cài đặt FFmpeg

**Ubuntu/Debian:**
```bash
sudo apt-get install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Windows:**
Tải từ [ffmpeg.org](https://ffmpeg.org/download.html) và thêm vào PATH

## Cách sử dụng nhanh

### Ví dụ đơn giản nhất:

```bash
python TimeSeriesRacing.py data.csv
```

Video sẽ được xuất ra file `output.mp4`

### Với các tùy chọn:

```bash
python TimeSeriesRacing.py data.csv --title "Evolution of Programming Languages" --top 10 --fps 30
```

### Xuất video cho TikTok/Reels (portrait):

```bash
python TimeSeriesRacing.py data.csv --ratio 9:16 --output tiktok.mp4
```

### Hiển thị dạng phần trăm:

```bash
python TimeSeriesRacing.py data.csv --percent --title "Market Share Evolution"
```

### Chỉ định cột cụ thể (long format):

```bash
python TimeSeriesRacing.py data.csv --time year --entity language --value popularity
```

## 🆕 Sử dụng Palettes và Presets (v2.0)

### Với Presets (Recommended)

Presets tự động cấu hình tối ưu cho từng platform:

```bash
# TikTok - Video viral nhanh, màu neon, 9:16
python TimeSeriesRacing.py data.csv --preset tiktok --title "Trending Now! 🔥"

# YouTube - Video chuyên nghiệp, 16:9
python TimeSeriesRacing.py data.csv --preset youtube --title "Data Analysis 2024"

# Instagram - Video aesthetic, pastel colors, 9:16
python TimeSeriesRacing.py data.csv --preset instagram --title "Beautiful Data 💕"

# Presentation - Chậm rãi, dễ đọc, professional
python TimeSeriesRacing.py data.csv --preset presentation --title "Q4 Report"
```

### Với Color Palettes

Chọn palette để video đẹp hơn:

```bash
# Neon - Rực rỡ cho viral content
python TimeSeriesRacing.py data.csv --palette neon

# Ocean - Xanh biển cho travel/nature
python TimeSeriesRacing.py data.csv --palette ocean

# Football - Cho sports content
python TimeSeriesRacing.py data.csv --palette football --bar-style gradient

# Professional - Cho business presentation
python TimeSeriesRacing.py data.csv --palette professional
```

**8 Palettes có sẵn**: `vibrant`, `professional`, `pastel`, `neon`, `ocean`, `sunset`, `earth`, `football`

**📖 Xem chi tiết**: [PALETTES_AND_PRESETS.md](PALETTES_AND_PRESETS.md)

## 🆕 Sử dụng V3.0 Ultra HD Features

### Chất lượng cực cao (Recommended)

```bash
# Default v3.0 - Automatically uses DPI 150, bar values, enhanced effects
python TimeSeriesRacing.py data.csv

# Ultra HD với DPI 200 + 60fps
python TimeSeriesRacing.py data.csv --dpi 200 --fps 60 --title "Ultra HD Demo"

# Maximum quality (DPI 300, 60fps, effects)
python TimeSeriesRacing.py data.csv --dpi 300 --fps 60 --palette neon
```

### Bar Values Control

```bash
# Default - Bar values shown
python TimeSeriesRacing.py data.csv

# Hide bar values for minimalist look
python TimeSeriesRacing.py data.csv --no-bar-values --palette pastel

# Combine with preset
python TimeSeriesRacing.py data.csv --preset tiktok --no-bar-values
```

### Custom Typography

```bash
# Serif font for professional look
python TimeSeriesRacing.py data.csv --font-family serif

# Monospace for tech/coding data
python TimeSeriesRacing.py data.csv --font-family monospace

# Custom font sizes
python TimeSeriesRacing.py data.csv --title-font-size 24 --bar-label-font-size 14
```

### Visual Effects Control

```bash
# Maximum effects (default in v3.0)
python TimeSeriesRacing.py data.csv --palette neon

# Disable effects for clean look
python TimeSeriesRacing.py data.csv --no-effects --palette professional

# Combine all v3.0 features
python TimeSeriesRacing.py data.csv \
  --dpi 200 \
  --fps 60 \
  --palette neon \
  --font-family sans-serif \
  --title "My Amazing Data 🚀"
```

### V3.0 + Presets

```bash
# TikTok Ultra HD
python TimeSeriesRacing.py data.csv --preset tiktok --dpi 200

# YouTube 60fps Ultra HD
python TimeSeriesRacing.py data.csv --preset youtube --fps 60 --dpi 180

# Instagram with custom font
python TimeSeriesRacing.py data.csv --preset instagram --font-family serif
```

## Định dạng dữ liệu

Phần mềm tự động nhận dạng 2 dạng dữ liệu phổ biến:

### 1. Long Format (3 cột)

Mỗi dòng là một bản ghi (thời gian, thực thể, giá trị):

```csv
year,language,popularity
1992,C,71.41
1992,C++,20.36
1992,Java,0
1996,C,59.11
1996,C++,17.21
1996,Java,12.03
2000,C,45.23
2000,C++,15.12
2000,Java,25.34
```

### 2. Wide Format (nhiều cột)

Mỗi cột là một thực thể, dòng đầu tiên là thời gian:

```csv
year,C,C++,Java,Python,JavaScript
1992,71.41,20.36,0,0,0
1996,59.11,17.21,12.03,0,0
2000,45.23,15.12,25.34,5.12,0
2004,32.45,12.34,30.21,10.23,8.45
2008,25.34,10.12,35.12,15.34,12.89
```

## Tham số CLI đầy đủ

```
python TimeSeriesRacing.py <input_file> [options]
```

### Tham số bắt buộc:

| Tham số | Mô tả |
|---------|-------|
| `input` | File dữ liệu đầu vào (CSV, Excel, JSON) |

### Tham số tùy chọn:

| Tham số | Mặc định | Mô tả |
|---------|----------|-------|
| `--title` | "Evolution of Data" | Tiêu đề video |
| `--top` | 10 | Số thanh hiển thị tối đa |
| `--fps` | 30 | Frame per second |
| `--percent` | False | Hiển thị giá trị dạng % |
| `--ratio` | 16:9 | Tỷ lệ khung hình (16:9 hoặc 9:16) |
| `--theme` | light | Theme màu sắc (light hoặc dark) |
| `--output` | output.mp4 | Tên file video đầu ra |
| `--period-length` | 500 | Độ dài mỗi period (ms) |
| `--steps-per-period` | 10 | Số bước mỗi period |

### Tham số cho Long Format:

| Tham số | Mô tả |
|---------|-------|
| `--time` | Tên cột thời gian (tự động phát hiện nếu không chỉ định) |
| `--entity` | Tên cột thực thể |
| `--value` | Tên cột giá trị |

## Ví dụ chi tiết

### 1. Video marketing với theme tối:

```bash
python TimeSeriesRacing.py market_share.csv \
  --title "Smartphone Market Share 2010-2024" \
  --theme dark \
  --top 8 \
  --percent \
  --output smartphone.mp4
```

### 2. Video cho TikTok với animation nhanh:

```bash
python TimeSeriesRacing.py trending.csv \
  --ratio 9:16 \
  --period-length 300 \
  --steps-per-period 15 \
  --title "Top Trending Topics" \
  --output tiktok.mp4
```

### 3. Video với dữ liệu Excel và cột cụ thể:

```bash
python TimeSeriesRacing.py data.xlsx \
  --time Year \
  --entity Country \
  --value GDP \
  --title "GDP Evolution by Country" \
  --top 15 \
  --output gdp_evolution.mp4
```

### 4. Video Premier League Trophy Race (Dữ liệu có sẵn):

```bash
# Video cơ bản 16:9
python TimeSeriesRacing.py examples/premier_league_trophies_wide.csv \
  --title "Premier League Trophy Race (1990-2024)" \
  --top 10 \
  --output pl_trophies.mp4

# Video TikTok 9:16
python TimeSeriesRacing.py examples/premier_league_trophies_long.csv \
  --title "English Football Trophy Race ⚽" \
  --ratio 9:16 \
  --top 8 \
  --output pl_tiktok.mp4

# Chạy tất cả demo bóng đá
bash examples/demo_football.sh
```

**Xem chi tiết**: `examples/PREMIER_LEAGUE_DATA.md`

## Cấu trúc file dự án

```
TimeSeriesRacing/
├── TimeSeriesRacing.py            # File chính (v2.0 enhanced)
├── requirements.txt               # Thư viện cần thiết
├── README.md                      # Tài liệu này
├── QUICKSTART.md                  # Hướng dẫn nhanh
├── PALETTES_AND_PRESETS.md        # 🆕 Hướng dẫn palettes và presets
├── LICENSE                        # MIT License
├── .gitignore                     # Git ignore rules
├── demo.sh                        # Demo script tổng hợp
└── examples/                      # Thư mục ví dụ
    ├── sample_long.csv                    # Dữ liệu mẫu long format
    ├── sample_wide.csv                    # Dữ liệu mẫu wide format
    ├── sample_coding.csv                  # Ví dụ ngôn ngữ lập trình
    ├── premier_league_trophies_wide.csv   # Danh hiệu bóng đá Anh (wide)
    ├── premier_league_trophies_long.csv   # Danh hiệu bóng đá Anh (long)
    ├── PREMIER_LEAGUE_DATA.md             # Tài liệu dữ liệu bóng đá
    └── demo_football.sh                   # Demo script cho bóng đá
```

## Tips & Tricks

### 1. Tăng tốc độ animation:
```bash
--period-length 300 --steps-per-period 15
```

### 2. Làm chậm để xem rõ hơn:
```bash
--period-length 800 --steps-per-period 8
```

### 3. Video chất lượng cao cho YouTube:
```bash
--fps 60 --ratio 16:9
```

### 4. Video nhanh cho social media:
```bash
--fps 30 --period-length 400 --ratio 9:16
```

## Xử lý lỗi thường gặp

### Lỗi: "No module named 'bar_chart_race'"
```bash
pip install bar_chart_race
```

### Lỗi: "ffmpeg not found"
Cài đặt FFmpeg theo hướng dẫn ở mục Cài đặt

### Lỗi: "ValueError: Could not convert to numeric"
Kiểm tra dữ liệu có chứa ký tự đặc biệt hoặc text trong cột giá trị

### Dữ liệu không hiển thị đúng:
Thử chỉ định cột cụ thể:
```bash
--time <tên_cột_thời_gian> --entity <tên_cột_thực_thể> --value <tên_cột_giá_trị>
```

## Yêu cầu hệ thống

- Python 3.7+
- RAM: tối thiểu 2GB (khuyến nghị 4GB cho dữ liệu lớn)
- FFmpeg
- Thời gian render: < 30 giây cho 2000 dòng dữ liệu (phụ thuộc vào cấu hình máy)

## Đóng góp

Mọi đóng góp đều được chào đón! Hãy tạo Pull Request hoặc báo lỗi qua Issues.

## License

MIT License - Tự do sử dụng cho mục đích cá nhân và thương mại.

## Tác giả

Phát triển bởi CongCuVui Team

## Changelog

### v3.0.0 (2025-10-27) 🚀 ULTRA HD
**Major Quality Upgrade**
- **Higher DPI (150 default)**: Video quality increased by 50% compared to v2.0
  - Supports DPI up to 300 for maximum quality
  - Default changed from 100 to 150 DPI
- **Bar Value Labels**: Values now displayed on bars by default
  - Toggle with `--no-bar-values` flag
  - Auto-formatted with thousands separator
- **Enhanced Visual Effects**:
  - Thicker borders (2.5px vs 2px)
  - Better alpha blending (0.92 vs 0.90)
  - Improved edge colors
  - zorder layering for better depth
- **Better Typography**:
  - Custom font family support (sans-serif, serif, monospace)
  - Improved font weight and styling
  - Better period label boldness
- **60fps Support**: Full support for 60fps ultra-smooth animations
- **Quality Control**: New CLI flags for fine control:
  - `--dpi`: Control video quality
  - `--no-bar-values`: Hide bar values
  - `--no-effects`: Disable visual effects
  - `--font-family`: Choose font style
- **Improved Bar Styling**:
  - Gradient bars now use 0.92 alpha
  - Solid bars use darker borders (#2C3E50)
  - Better zorder (10) for proper layering
- **Enhanced Output Info**: Shows DPI, FPS, bar values, effects status in output
- **Backward Compatible**: All v2.0 features still work, v3.0 is opt-in enhancement

### v2.0.0 (2025-10-27) 🎉
- **8 Color Palettes chuyên nghiệp**: Vibrant, Professional, Neon, Pastel, Ocean, Sunset, Earth, Football
- **4 Style Presets**: TikTok, YouTube, Instagram, Presentation với auto-config
- **Gradient Bar Styles**: Bars với gradient colors và border styling
- **Enhanced Typography**: Font sizing tối ưu cho từng platform
- **Smooth Animations**: Mặc định tăng từ 10 lên 12-15 steps per period
- **Better Period Labels**: Positioning và styling được cải thiện
- **Platform Optimization**: Tự động tối ưu cho từng social media platform
- **Improved Bar Styling**: Alpha, edge colors, line width được tinh chỉnh
- **Total Summary**: Hiển thị tổng giá trị ở cuối video
- **Comprehensive Documentation**: Thêm PALETTES_AND_PRESETS.md với hướng dẫn chi tiết

### v1.0.0 (2025-10-27)
- Phiên bản đầu tiên
- Hỗ trợ CSV, Excel, JSON
- Tự động nhận dạng cấu trúc dữ liệu (long/wide format)
- Xuất video MP4
- CLI đầy đủ tính năng
- Dữ liệu mẫu Premier League Trophy Race
