#!/bin/bash
# trim_screencast.sh - Script tối ưu cho video screencast/tutorial
#
# Sử dụng:
#   ./trim_screencast.sh input.mp4 [output.mp4]

if [ $# -lt 1 ]; then
    echo "Sử dụng: $0 <input_video> [output_video]"
    echo "Ví dụ: $0 tutorial.mp4"
    echo "       $0 tutorial.mp4 tutorial_trimmed.mp4"
    exit 1
fi

INPUT="$1"
OUTPUT="${2:-}"

# Cấu hình tối ưu cho screencast:
# - Threshold -40dB: nghiêm ngặt hơn (loại bỏ nhiều im lặng hơn)
# - Duration 2.0s: chỉ loại bỏ khoảng lặng dài (>2 giây)
# - Margin 0.3s: margin ngắn hơn cho screencast
# - Preset veryfast: xử lý nhanh

if [ -z "$OUTPUT" ]; then
    python3 ../video_silence_trim.py "$INPUT" \
        --threshold -40dB \
        --duration 2.0 \
        --margin 0.3 \
        --preset veryfast
else
    python3 ../video_silence_trim.py "$INPUT" -o "$OUTPUT" \
        --threshold -40dB \
        --duration 2.0 \
        --margin 0.3 \
        --preset veryfast
fi
