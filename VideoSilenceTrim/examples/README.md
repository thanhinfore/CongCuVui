# Examples - VideoSilenceTrim

Thư mục này chứa các script ví dụ và use cases cho VideoSilenceTrim.

## 📁 Danh sách files

### Shell Scripts

#### 1. `trim_lecture.sh`
Script tối ưu cho video bài giảng/presentation.

**Sử dụng:**
```bash
chmod +x trim_lecture.sh
./trim_lecture.sh input.mp4
./trim_lecture.sh input.mp4 output.mp4
```

**Cấu hình:**
- Threshold: -35dB
- Duration: 1.0s (loại bỏ khoảng lặng >1 giây)
- Margin: 0.5s
- Preset: veryfast

**Phù hợp cho:**
- Video bài giảng
- Presentation
- Webinar

---

#### 2. `trim_screencast.sh`
Script tối ưu cho video screencast/tutorial.

**Sử dụng:**
```bash
chmod +x trim_screencast.sh
./trim_screencast.sh tutorial.mp4
./trim_screencast.sh tutorial.mp4 tutorial_trimmed.mp4
```

**Cấu hình:**
- Threshold: -40dB (nghiêm ngặt hơn)
- Duration: 2.0s (loại bỏ khoảng lặng >2 giây)
- Margin: 0.3s
- Preset: veryfast

**Phù hợp cho:**
- Screen recording
- Video tutorial
- Coding demos

---

#### 3. `batch_process.sh`
Xử lý hàng loạt nhiều video files.

**Sử dụng:**
```bash
chmod +x batch_process.sh

# Process tất cả MP4 trong thư mục hiện tại
./batch_process.sh

# Process tất cả MP4 trong thư mục cụ thể
./batch_process.sh /path/to/videos "*.mp4"

# Process tất cả AVI files
./batch_process.sh . "*.avi"
```

**Tính năng:**
- Tự động tìm tất cả files matching pattern
- Hiển thị progress (N/Total)
- Báo cáo success/fail cho từng file
- Thống kê tổng kết

**Phù hợp cho:**
- Xử lý nhiều files cùng lúc
- Automation workflows
- Batch conversion

---

### Python Scripts

#### 4. `gui_example.py`
Giao diện đồ họa (GUI) đơn giản sử dụng tkinter.

**Yêu cầu:**
- Python 3.7+
- tkinter (thường được cài sẵn với Python)

**Sử dụng:**
```bash
python gui_example.py
```

hoặc

```bash
chmod +x gui_example.py
./gui_example.py
```

**Tính năng:**
- Giao diện trực quan, dễ sử dụng
- Chọn file input/output bằng dialog
- Tùy chỉnh tất cả parameters
- Hiển thị progress realtime
- Log output chi tiết
- Xử lý trong background thread (không block UI)

**Phù hợp cho:**
- Người dùng không quen command line
- Desktop application
- Demo/presentation

---

## 🚀 Quick Start

### Sử dụng shell scripts

```bash
# 1. Di chuyển vào thư mục examples
cd examples

# 2. Cấp quyền thực thi
chmod +x *.sh

# 3. Chạy script
./trim_lecture.sh ../test_video.mp4
```

### Sử dụng GUI

```bash
# Di chuyển vào thư mục examples
cd examples

# Chạy GUI
python gui_example.py
```

## 💡 Tips

### 1. Tùy chỉnh scripts

Bạn có thể sửa các scripts để thay đổi parameters mặc định:

```bash
# Mở script bằng editor
nano trim_lecture.sh

# Tìm và sửa dòng:
--threshold -35dB \    # Thay đổi threshold
--duration 1.0 \       # Thay đổi duration
--margin 0.5 \         # Thay đổi margin
--preset veryfast      # Thay đổi preset
```

### 2. Tạo script riêng

Copy và customize cho use case của bạn:

```bash
# Copy script mẫu
cp trim_lecture.sh my_custom_trim.sh

# Sửa đổi theo ý bạn
nano my_custom_trim.sh

# Sử dụng
./my_custom_trim.sh video.mp4
```

### 3. Kết hợp với automation tools

```bash
# Cron job - tự động xử lý videos mới mỗi ngày
# Thêm vào crontab:
0 2 * * * /path/to/batch_process.sh /path/to/videos "*.mp4" >> /var/log/video_trim.log 2>&1
```

### 4. Xử lý từ Python script

```python
import sys
sys.path.insert(0, '..')

from video_silence_trim import VideoSilenceTrim, VideoSilenceTrimConfig

# Tạo config
config = VideoSilenceTrimConfig(
    silence_threshold='-35dB',
    min_silence_duration=0.5,
    margin_seconds=0.5
)

# Xử lý video
trimmer = VideoSilenceTrim(config)
trimmer.process_video('input.mp4', 'output.mp4')
```

## 📝 Use Case Examples

### Lecture/Presentation
```bash
./trim_lecture.sh lecture.mp4
```
→ Giữ lại pauses ngắn, loại bỏ silent sections dài

### Screencast/Tutorial
```bash
./trim_screencast.sh tutorial.mp4
```
→ Loại bỏ nhiều silence hơn, margin ngắn hơn

### Podcast/Interview
```bash
# Sử dụng threshold thấp hơn để giữ nhiều audio hơn
python ../video_silence_trim.py podcast.mp4 \
    --threshold -30dB \
    --duration 0.5 \
    --margin 0.5
```

### Gaming Highlights
```bash
# Duration dài để chỉ giữ action scenes
python ../video_silence_trim.py gameplay.mp4 \
    --threshold -25dB \
    --duration 3.0 \
    --margin 0.2
```

## 🐛 Troubleshooting

### Script không chạy được
```bash
# Đảm bảo script có quyền thực thi
chmod +x *.sh

# Nếu vẫn lỗi, chạy trực tiếp bằng bash
bash trim_lecture.sh video.mp4
```

### GUI không khởi động
```bash
# Kiểm tra tkinter
python -m tkinter

# Nếu thiếu, cài đặt:
# Ubuntu/Debian
sudo apt-get install python3-tk

# macOS (thường có sẵn)
# Windows (thường có sẵn)
```

### Path issues trong scripts
```bash
# Sử dụng absolute path
python /full/path/to/video_silence_trim.py video.mp4

# Hoặc set PYTHONPATH
export PYTHONPATH=/path/to/VideoSilenceTrim:$PYTHONPATH
```

## 📚 Tài liệu thêm

- [Main README](../README.md) - Documentation chính
- [Config Example](../config.example.json) - Ví dụ config file

---

**Happy Trimming! 🎬✂️**
