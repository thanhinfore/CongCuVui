#!/bin/bash

# Demo script for TimeSeriesRacing
# Chạy các ví dụ demo

echo "=================================="
echo "TimeSeriesRacing - Demo Script"
echo "=================================="
echo ""

# Check if examples directory exists
if [ ! -d "examples" ]; then
    echo "❌ Thư mục examples không tồn tại!"
    exit 1
fi

# Demo 1: Basic video
echo "📹 Demo 1: Tạo video cơ bản..."
python3 TimeSeriesRacing.py examples/sample_coding.csv \
    --title "Evolution of Programming Languages" \
    --output demo1_basic.mp4

echo ""
echo "✅ Demo 1 hoàn thành! File: demo1_basic.mp4"
echo ""

# Demo 2: Portrait mode for TikTok
echo "📱 Demo 2: Tạo video portrait cho TikTok/Reels..."
python3 TimeSeriesRacing.py examples/sample_coding.csv \
    --title "Top Programming Languages" \
    --ratio 9:16 \
    --output demo2_tiktok.mp4

echo ""
echo "✅ Demo 2 hoàn thành! File: demo2_tiktok.mp4"
echo ""

# Demo 3: Dark theme
echo "🌙 Demo 3: Tạo video với theme tối..."
python3 TimeSeriesRacing.py examples/sample_wide.csv \
    --title "Programming Languages Dark Mode" \
    --theme dark \
    --output demo3_dark.mp4

echo ""
echo "✅ Demo 3 hoàn thành! File: demo3_dark.mp4"
echo ""

# Demo 4: Percentage mode
echo "📊 Demo 4: Tạo video với hiển thị phần trăm..."
python3 TimeSeriesRacing.py examples/sample_long.csv \
    --title "Market Share Evolution (%)" \
    --percent \
    --output demo4_percent.mp4

echo ""
echo "✅ Demo 4 hoàn thành! File: demo4_percent.mp4"
echo ""

echo "=================================="
echo "🎉 Tất cả demo đã hoàn thành!"
echo "=================================="
echo ""
echo "Các file video đã được tạo:"
ls -lh demo*.mp4 2>/dev/null || echo "Không tìm thấy file video"
