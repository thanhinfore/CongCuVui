# VideoSilenceTrim 🎬

**Chương trình Python tự động loại bỏ các đoạn im lặng trong video**

VideoSilenceTrim là phiên bản Python của project [VideoStrimming](../VideoStrimming), cung cấp khả năng xử lý video mạnh mẽ hơn với giao diện dòng lệnh (CLI) dễ sử dụng.

## ✨ Tính năng

- 🎯 **Tự động phát hiện im lặng** - Sử dụng FFmpeg để phân tích và phát hiện các đoạn im lặng
- ✂️ **Trim thông minh** - Giữ lại các đoạn có âm thanh với margin buffer để chuyển tiếp mượt mà
- 🎨 **Cấu hình linh hoạt** - Tùy chỉnh ngưỡng âm thanh, độ dài im lặng, margin, codec, preset...
- 📊 **Thông tin chi tiết** - Hiển thị tiến trình xử lý và thống kê đầy đủ
- 🔧 **Hỗ trợ nhiều format** - Hoạt động với tất cả các format video mà FFmpeg hỗ trợ (MP4, AVI, MKV, MOV...)
- 💾 **Config file** - Lưu và tái sử dụng cấu hình qua file JSON
- ⚡ **Xử lý nhanh** - Sử dụng preset encoding tối ưu và xử lý trực tiếp trên máy local
- 🔄 **Xử lý thông minh** - Tự động chọn phương pháp tối ưu (filter_complex hoặc concat demuxer) dựa trên số lượng segments

## 📋 Yêu cầu hệ thống

- **Python**: 3.7 trở lên
- **FFmpeg**: 4.0 trở lên (bắt buộc)
- **Hệ điều hành**: Linux, macOS, Windows

## 🚀 Cài đặt

### 1. Cài đặt FFmpeg

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

**macOS (với Homebrew):**
```bash
brew install ffmpeg
```

**Windows:**
- Download từ [FFmpeg Official Site](https://ffmpeg.org/download.html)
- Hoặc dùng Chocolatey: `choco install ffmpeg`

**Kiểm tra cài đặt:**
```bash
ffmpeg -version
```

### 2. Cài đặt chương trình

```bash
# Clone hoặc download project
cd VideoSilenceTrim

# Cấp quyền thực thi (Linux/macOS)
chmod +x video_silence_trim.py
```

## 📖 Hướng dẫn sử dụng

### Cách sử dụng cơ bản

```bash
# Cách 1: Tự động tạo tên file output
python video_silence_trim.py input.mp4

# Cách 2: Chỉ định tên file output
python video_silence_trim.py input.mp4 -o output.mp4
```

### Tùy chỉnh tham số

```bash
# Thay đổi ngưỡng im lặng (dB)
python video_silence_trim.py input.mp4 --threshold -30dB

# Thay đổi độ dài tối thiểu của đoạn im lặng (giây)
python video_silence_trim.py input.mp4 --duration 1.0

# Thay đổi margin buffer (giây)
python video_silence_trim.py input.mp4 --margin 0.3

# Thay đổi preset encoding (nhanh hơn nhưng file lớn hơn)
python video_silence_trim.py input.mp4 --preset ultrafast

# Kết hợp nhiều tùy chọn
python video_silence_trim.py input.mp4 -o output.mp4 \
    --threshold -30dB \
    --duration 1.0 \
    --margin 0.3 \
    --preset veryfast
```

### Sử dụng config file

```bash
# Lưu cấu hình hiện tại vào file
python video_silence_trim.py --save-config my_config.json --threshold -30dB --duration 1.0

# Sử dụng config file đã lưu
python video_silence_trim.py input.mp4 --config my_config.json

# Xem config mẫu
cat config.example.json
```

### Hiển thị thông tin debug

```bash
python video_silence_trim.py input.mp4 -v
```

## ⚙️ Tham số cấu hình

### Command Line Arguments

| Tham số | Mô tả | Giá trị mặc định |
|---------|-------|------------------|
| `input` | Đường dẫn file video đầu vào | (bắt buộc) |
| `-o, --output` | Đường dẫn file video đầu ra | `{input}_trimmed.{ext}` |
| `--threshold` | Ngưỡng âm thanh (dB) | `-35dB` |
| `--duration` | Độ dài im lặng tối thiểu (giây) | `0.5` |
| `--margin` | Margin buffer (giây) | `0.5` |
| `--preset` | Preset encoding | `veryfast` |
| `--config` | Đường dẫn config file JSON | - |
| `--save-config` | Lưu config vào file | - |
| `-v, --verbose` | Hiển thị debug info | `False` |

### Config File (JSON)

```json
{
    "silence_threshold": "-35dB",
    "min_silence_duration": 0.5,
    "margin_seconds": 0.5,
    "min_segment_duration": 0.05,
    "video_codec": "libx264",
    "video_preset": "veryfast",
    "audio_codec": "aac",
    "audio_bitrate": "192k"
}
```

### Giải thích tham số

- **silence_threshold**: Mức âm lượng (dB) để coi là im lặng. Giá trị càng âm (ví dụ: -40dB) thì càng nghiêm ngặt.
- **min_silence_duration**: Đoạn im lặng phải dài ít nhất bao nhiêu giây mới được loại bỏ.
- **margin_seconds**: Thời gian buffer thêm vào trước/sau mỗi đoạn có âm thanh để chuyển tiếp tự nhiên.
- **min_segment_duration**: Segment ngắn hơn giá trị này sẽ bị loại bỏ (tránh các đoạn quá ngắn).
- **video_codec**: Codec để encode video (libx264, libx265, vp9...).
- **video_preset**: Preset encoding ảnh hưởng đến tốc độ/chất lượng:
  - `ultrafast` → Nhanh nhất, file lớn nhất
  - `veryfast` → Cân bằng tốt (khuyến nghị)
  - `medium` → Chất lượng tốt, chậm hơn
  - `slow/slower` → Chất lượng cao nhất, rất chậm
- **audio_codec**: Codec audio (aac, mp3, libopus...).
- **audio_bitrate**: Bitrate audio (128k, 192k, 256k...).

## 📊 Output ví dụ

```
============================================================
VIDEO SILENCE TRIM - BẮT ĐẦU XỬ LÝ
============================================================
Input: presentation.mp4
Output: presentation_trimmed.mp4
============================================================
2025-01-15 10:30:15 - VideoSilenceTrim - INFO - ✓ FFmpeg đã được cài đặt
2025-01-15 10:30:15 - VideoSilenceTrim - INFO - Đang lấy thông tin video: presentation.mp4
2025-01-15 10:30:15 - VideoSilenceTrim - INFO - ✓ Độ dài video: 300.45s (5.01 phút)
2025-01-15 10:30:15 - VideoSilenceTrim - INFO - Đang phát hiện các đoạn im lặng...
2025-01-15 10:30:15 - VideoSilenceTrim - INFO -   - Ngưỡng: -35dB
2025-01-15 10:30:15 - VideoSilenceTrim - INFO -   - Độ dài tối thiểu: 0.5s
2025-01-15 10:30:20 - VideoSilenceTrim - INFO - ✓ Phát hiện được 15 đoạn im lặng
2025-01-15 10:30:20 - VideoSilenceTrim - INFO -   1. SilenceInterval(start=5.30s, end=12.80s)
2025-01-15 10:30:20 - VideoSilenceTrim - INFO -   2. SilenceInterval(start=25.10s, end=31.50s)
...
2025-01-15 10:30:20 - VideoSilenceTrim - INFO - Đang tính toán các segment cần giữ lại...
2025-01-15 10:30:20 - VideoSilenceTrim - INFO - ✓ Tìm được 16 segment để giữ lại
2025-01-15 10:30:20 - VideoSilenceTrim - INFO -   - Độ dài gốc: 300.45s
2025-01-15 10:30:20 - VideoSilenceTrim - INFO -   - Độ dài sau trim: 180.25s
2025-01-15 10:30:20 - VideoSilenceTrim - INFO -   - Giảm: 40.0%
2025-01-15 10:30:20 - VideoSilenceTrim - INFO - Đang trim video...
2025-01-15 10:30:20 - VideoSilenceTrim - INFO - FFmpeg đang xử lý...
  Tiến trình: 00:03:00.25
2025-01-15 10:31:45 - VideoSilenceTrim - INFO - ✓ Trim video thành công!
2025-01-15 10:31:45 - VideoSilenceTrim - INFO -   Output: presentation_trimmed.mp4
2025-01-15 10:31:45 - VideoSilenceTrim - INFO -   Kích thước: 45.32 MB
============================================================
✓ HOÀN TẤT XỬ LÝ VIDEO
============================================================

✓ Thành công! Output: presentation_trimmed.mp4
```

## 🎓 Use Cases

### 1. Lecture/Presentation Videos
```bash
python video_silence_trim.py lecture.mp4 --threshold -35dB --duration 1.0
```
Loại bỏ các khoảng dừng dài trong bài giảng.

### 2. Screen Recording
```bash
python video_silence_trim.py screencast.mp4 --threshold -40dB --duration 2.0
```
Loại bỏ các đoạn không có giải thích trong video hướng dẫn.

### 3. Podcast/Interview
```bash
python video_silence_trim.py podcast.mp4 --threshold -30dB --margin 0.3
```
Cắt bỏ khoảng lặng giữa các câu hỏi và trả lời.

### 4. Gaming Highlights
```bash
python video_silence_trim.py gameplay.mp4 --threshold -25dB --duration 3.0
```
Giữ lại các phần có action, loại bỏ downtime.

## 🔍 So sánh với VideoStrimming

| Tính năng | VideoStrimming (Web) | VideoSilenceTrim (Python) |
|-----------|---------------------|---------------------------|
| Nền tảng | Browser (WebAssembly) | Desktop (Python) |
| Cài đặt | Không cần cài đặt | Cần Python + FFmpeg |
| Tốc độ | Trung bình | Nhanh hơn (native FFmpeg) |
| Giới hạn file | ~200MB (RAM browser) | Không giới hạn |
| Format hỗ trợ | MP4 | Tất cả format FFmpeg |
| Tùy chỉnh | Giới hạn | Rất linh hoạt |
| Batch processing | Không | Có thể scripting |
| Privacy | 100% local (browser) | 100% local (desktop) |
| UI | Giao diện đồ họa | Command line |

## 🔧 Chi tiết kỹ thuật

### Phương pháp xử lý

VideoSilenceTrim tự động chọn phương pháp xử lý tối ưu dựa trên số lượng segments:

#### 1. Filter Complex Method (≤20 segments)
Sử dụng FFmpeg filter_complex để trim và concat trong một pass:
- **Ưu điểm**: Nhanh, không cần file tạm, xử lý trong 1 lần
- **Nhược điểm**: Giới hạn số segments (command line length, memory)
- **Phù hợp**: Video có ít đoạn im lặng

```bash
# Ví dụ filter_complex command
[0:v]trim=start=0:end=10,setpts=PTS-STARTPTS[v0];
[0:a]atrim=start=0:end=10,asetpts=PTS-STARTPTS[a0];
[v0][a0]concat=n=1:v=1:a=1[outv][outa]
```

#### 2. Concat Demuxer Method (>20 segments)
Tự động chuyển sang concat demuxer khi có nhiều segments:
- **Bước 1**: Trim từng segment ra file tạm (dùng `-c copy`, rất nhanh)
- **Bước 2**: Tạo file list các segments
- **Bước 3**: Concat tất cả bằng concat demuxer
- **Bước 4**: Cleanup temp files

**Ưu điểm**:
- Xử lý được số lượng segments không giới hạn
- Ổn định hơn với video dài
- Không bị giới hạn command line length

**Nhược điểm**:
- Cần thêm disk space cho temp files
- Chậm hơn một chút do cần 2 passes

```bash
# Ví dụ concat demuxer
ffmpeg -f concat -safe 0 -i concat_list.txt -c:v libx264 output.mp4
```

### Khi nào sử dụng phương pháp nào?

Chương trình **tự động quyết định**, nhưng bạn có thể hiểu quy tắc:

| Số segments | Phương pháp | Lý do |
|-------------|-------------|-------|
| 1-20 | Filter Complex | Tốc độ tối ưu |
| >20 | Concat Demuxer | Ổn định, không giới hạn |

**Ví dụ từ output của bạn**:
```
✓ Phát hiện được 57 đoạn im lặng
→ Tự động sử dụng Concat Demuxer
→ Hiển thị: "Sử dụng concat demuxer (ổn định hơn cho 57 segments)"
```

## 🛠️ Xử lý sự cố

### Lỗi: "FFmpeg chưa được cài đặt"
```
✗ FFmpeg chưa được cài đặt!
Vui lòng cài đặt FFmpeg: https://ffmpeg.org/download.html
```
**Giải pháp**: Cài đặt FFmpeg theo hướng dẫn ở phần [Cài đặt](#-cài-đặt)

### Không tìm thấy đoạn im lặng
```
Không tìm thấy đoạn im lặng nào. Video không cần trim.
```
**Giải pháp**:
- Giảm threshold (ví dụ: từ -35dB xuống -30dB)
- Giảm min_silence_duration (ví dụ: từ 0.5s xuống 0.2s)

### Video output bị giật/lag
**Giải pháp**:
- Tăng margin_seconds để có thời gian chuyển tiếp mượt hơn
- Thử preset khác: `--preset medium` hoặc `--preset slow`

### File output quá lớn
**Giải pháp**:
- Dùng preset nhanh hơn: `--preset veryfast` hoặc `--preset ultrafast`
- Giảm audio bitrate trong config file

## 📝 Tips & Tricks

### 1. Batch Processing
```bash
# Process tất cả MP4 files trong thư mục
for file in *.mp4; do
    python video_silence_trim.py "$file"
done
```

### 2. Tạo script riêng
```bash
#!/bin/bash
# trim_lecture.sh
python video_silence_trim.py "$1" \
    --threshold -35dB \
    --duration 1.0 \
    --margin 0.5 \
    --preset veryfast

# Sử dụng:
# ./trim_lecture.sh lecture1.mp4
```

### 3. Optimize cho tốc độ
```bash
python video_silence_trim.py input.mp4 --preset ultrafast
```

### 4. Optimize cho chất lượng
```bash
python video_silence_trim.py input.mp4 --preset slow
```

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng:
1. Fork repository
2. Tạo branch mới (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

Project này là phần của **CongCuVui** - Bộ công cụ tiện ích đa năng.

## 👥 Tác giả

**CongCuVui Team**

## 🙏 Cảm ơn

- [FFmpeg](https://ffmpeg.org/) - Thư viện xử lý video mạnh mẽ
- [VideoStrimming](../VideoStrimming) - Project gốc sử dụng FFmpeg.wasm

## 📞 Liên hệ & Hỗ trợ

Nếu gặp vấn đề hoặc có câu hỏi, vui lòng:
- Tạo issue trên GitHub
- Kiểm tra phần [Xử lý sự cố](#-xử-lý-sự-cố)
- Đọc documentation của FFmpeg

---

**Happy Trimming! 🎬✂️**
