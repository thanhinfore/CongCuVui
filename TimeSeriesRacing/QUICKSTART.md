# Quick Start Guide - TimeSeriesRacing

Hướng dẫn nhanh để bắt đầu tạo video biểu đồ động trong 5 phút!

## Bước 1: Cài đặt dependencies

```bash
# Di chuyển vào thư mục dự án
cd TimeSeriesRacing

# Cài đặt thư viện Python
pip install -r requirements.txt

# Cài đặt FFmpeg (nếu chưa có)
# Ubuntu/Debian:
sudo apt-get install ffmpeg

# macOS:
brew install ffmpeg

# Windows: Tải từ https://ffmpeg.org/download.html
```

## Bước 2: Chạy demo đầu tiên

```bash
# Chạy với dữ liệu mẫu
python TimeSeriesRacing.py examples/sample_coding.csv
```

Kết quả: Video `output.mp4` sẽ được tạo trong thư mục hiện tại.

## Bước 3: Tùy chỉnh video

### Video đẹp hơn với tiêu đề:

```bash
python TimeSeriesRacing.py examples/sample_coding.csv \
  --title "Evolution of Programming Languages 2015-2024"
```

### Video cho TikTok/Reels (9:16):

```bash
python TimeSeriesRacing.py examples/sample_coding.csv \
  --title "Top Programming Languages" \
  --ratio 9:16 \
  --output tiktok.mp4
```

### Video với theme tối:

```bash
python TimeSeriesRacing.py examples/sample_coding.csv \
  --title "Programming Languages Race" \
  --theme dark \
  --output dark_mode.mp4
```

## Bước 4: Sử dụng dữ liệu của bạn

### Định dạng Long Format (3 cột):

Tạo file `mydata.csv`:

```csv
year,category,value
2020,Product A,100
2020,Product B,150
2021,Product A,180
2021,Product B,200
2022,Product A,250
2022,Product B,280
```

Chạy:

```bash
python TimeSeriesRacing.py mydata.csv --title "Product Sales Evolution"
```

### Định dạng Wide Format (nhiều cột):

Tạo file `sales.csv`:

```csv
year,Product A,Product B,Product C
2020,100,150,80
2021,180,200,120
2022,250,280,180
```

Chạy:

```bash
python TimeSeriesRacing.py sales.csv --title "Sales Comparison"
```

## Bước 5: Các tùy chọn hay ho

### Animation nhanh hơn:

```bash
python TimeSeriesRacing.py mydata.csv \
  --period-length 300 \
  --steps-per-period 15
```

### Hiển thị top 5 thay vì 10:

```bash
python TimeSeriesRacing.py mydata.csv --top 5
```

### Hiển thị phần trăm (%):

```bash
python TimeSeriesRacing.py mydata.csv --percent
```

### Video chất lượng cao (60 FPS):

```bash
python TimeSeriesRacing.py mydata.csv --fps 60
```

## Xử lý lỗi nhanh

### Lỗi: "ModuleNotFoundError: No module named 'bar_chart_race'"

```bash
pip install bar_chart_race
```

### Lỗi: "ffmpeg not found"

Cài đặt FFmpeg theo hướng dẫn Bước 1.

### Dữ liệu không đúng format?

Chỉ định cột cụ thể:

```bash
python TimeSeriesRacing.py mydata.csv \
  --time Year \
  --entity Name \
  --value Sales
```

## Tips & Tricks

1. **Cho video TikTok**: Dùng `--ratio 9:16` và `--period-length 300`
2. **Cho video YouTube**: Dùng `--fps 60` và `--ratio 16:9`
3. **Animation mượt mà**: Tăng `--steps-per-period` lên 15-20
4. **Animation nhanh**: Giảm `--period-length` xuống 300-400

## Xem trợ giúp đầy đủ

```bash
python TimeSeriesRacing.py --help
```

## Các file demo có sẵn

- `examples/sample_long.csv` - Long format data
- `examples/sample_wide.csv` - Wide format data
- `examples/sample_coding.csv` - Ví dụ ngôn ngữ lập trình

Chúc bạn tạo video thành công!
