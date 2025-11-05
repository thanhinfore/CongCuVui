#!/bin/bash
# trim_lecture.sh - Script tối ưu cho video bài giảng/presentation
#
# Sử dụng:
#   ./trim_lecture.sh input.mp4 [output.mp4]

if [ $# -lt 1 ]; then
    echo "Sử dụng: $0 <input_video> [output_video]"
    echo "Ví dụ: $0 lecture.mp4"
    echo "       $0 lecture.mp4 lecture_trimmed.mp4"
    exit 1
fi

INPUT="$1"
OUTPUT="${2:-}"

# Cấu hình tối ưu cho lecture:
# - Threshold -35dB: loại bỏ im lặng rõ ràng
# - Duration 1.0s: chỉ loại bỏ khoảng lặng dài (>1 giây)
# - Margin 0.5s: giữ buffer tự nhiên
# - Preset veryfast: cân bằng tốc độ/chất lượng

if [ -z "$OUTPUT" ]; then
    python3 ../video_silence_trim.py "$INPUT" \
        --threshold -35dB \
        --duration 1.0 \
        --margin 0.5 \
        --preset veryfast
else
    python3 ../video_silence_trim.py "$INPUT" -o "$OUTPUT" \
        --threshold -35dB \
        --duration 1.0 \
        --margin 0.5 \
        --preset veryfast
fi
