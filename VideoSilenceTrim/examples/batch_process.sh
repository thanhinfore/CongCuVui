#!/bin/bash
# batch_process.sh - Xử lý hàng loạt video files
#
# Sử dụng:
#   ./batch_process.sh [directory] [pattern]
#
# Ví dụ:
#   ./batch_process.sh /path/to/videos "*.mp4"
#   ./batch_process.sh . "*.avi"

DIRECTORY="${1:-.}"
PATTERN="${2:-*.mp4}"

echo "=========================================="
echo "BATCH VIDEO SILENCE TRIM"
echo "=========================================="
echo "Thư mục: $DIRECTORY"
echo "Pattern: $PATTERN"
echo "=========================================="

# Đếm số file
file_count=$(find "$DIRECTORY" -maxdepth 1 -name "$PATTERN" -type f | wc -l)
echo "Tìm thấy $file_count file(s)"
echo ""

if [ $file_count -eq 0 ]; then
    echo "Không tìm thấy file nào!"
    exit 1
fi

# Process từng file
current=0
for file in "$DIRECTORY"/$PATTERN; do
    if [ -f "$file" ]; then
        current=$((current + 1))
        echo "=========================================="
        echo "[$current/$file_count] Đang xử lý: $(basename "$file")"
        echo "=========================================="

        python3 ../video_silence_trim.py "$file" \
            --threshold -35dB \
            --duration 0.5 \
            --margin 0.5

        if [ $? -eq 0 ]; then
            echo "✓ Thành công!"
        else
            echo "✗ Lỗi khi xử lý file này"
        fi
        echo ""
    fi
done

echo "=========================================="
echo "✓ HOÀN THÀNH! Đã xử lý $current/$file_count file(s)"
echo "=========================================="
