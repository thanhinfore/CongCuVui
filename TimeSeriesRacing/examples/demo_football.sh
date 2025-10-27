#!/bin/bash

# Demo script cho dữ liệu Premier League
# Tạo các video bar chart race về danh hiệu bóng đá Anh

echo "=========================================================="
echo "  PREMIER LEAGUE TROPHY RACE - Demo Videos"
echo "=========================================================="
echo ""

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PARENT_DIR="$( dirname "$SCRIPT_DIR" )"

cd "$PARENT_DIR" || exit 1

# Check if data files exist
if [ ! -f "examples/premier_league_trophies_wide.csv" ]; then
    echo "❌ File dữ liệu không tồn tại!"
    exit 1
fi

echo "📊 Tìm thấy file dữ liệu:"
echo "   - premier_league_trophies_wide.csv (35 năm)"
echo "   - premier_league_trophies_long.csv (300+ records)"
echo ""

# Demo 1: Video cơ bản - Wide format
echo "🎬 Demo 1: Video cơ bản (16:9 - YouTube/Desktop)"
echo "   Format: Wide"
echo "   Title: Premier League Trophy Race 1990-2024"
echo "   Top: 10 teams"
echo ""

python3 TimeSeriesRacing.py examples/premier_league_trophies_wide.csv \
    --title "Premier League Trophy Race (1990-2024)" \
    --top 10 \
    --output pl_trophy_race.mp4

if [ $? -eq 0 ]; then
    echo "✅ Demo 1 hoàn thành: pl_trophy_race.mp4"
else
    echo "❌ Demo 1 thất bại!"
fi
echo ""

# Demo 2: Video TikTok Portrait - Long format
echo "📱 Demo 2: Video Portrait (9:16 - TikTok/Reels/Shorts)"
echo "   Format: Long"
echo "   Title: English Football Trophy Race ⚽"
echo "   Top: 8 teams"
echo ""

python3 TimeSeriesRacing.py examples/premier_league_trophies_long.csv \
    --title "English Football Trophy Race ⚽" \
    --ratio 9:16 \
    --top 8 \
    --output pl_tiktok.mp4

if [ $? -eq 0 ]; then
    echo "✅ Demo 2 hoàn thành: pl_tiktok.mp4"
else
    echo "❌ Demo 2 thất bại!"
fi
echo ""

# Demo 3: Dark theme video
echo "🌙 Demo 3: Video Dark Theme"
echo "   Format: Wide"
echo "   Theme: Dark"
echo "   Top: 10 teams"
echo ""

python3 TimeSeriesRacing.py examples/premier_league_trophies_wide.csv \
    --title "Evolution of English Football Dominance" \
    --theme dark \
    --top 10 \
    --period-length 600 \
    --output pl_dark.mp4

if [ $? -eq 0 ]; then
    echo "✅ Demo 3 hoàn thành: pl_dark.mp4"
else
    echo "❌ Demo 3 thất bại!"
fi
echo ""

# Demo 4: Fast animation for social media
echo "⚡ Demo 4: Fast Animation (Social Media)"
echo "   Format: Long"
echo "   Speed: Fast (period-length: 300ms)"
echo "   Top: 6 teams (Big 6)"
echo ""

python3 TimeSeriesRacing.py examples/premier_league_trophies_long.csv \
    --title "Who Rules English Football?" \
    --top 6 \
    --period-length 300 \
    --steps-per-period 15 \
    --fps 30 \
    --output pl_fast.mp4

if [ $? -eq 0 ]; then
    echo "✅ Demo 4 hoàn thành: pl_fast.mp4"
else
    echo "❌ Demo 4 thất bại!"
fi
echo ""

# Summary
echo "=========================================================="
echo "🎉 Demo hoàn thành!"
echo "=========================================================="
echo ""
echo "Các file video đã tạo:"
ls -lh pl_*.mp4 2>/dev/null | awk '{print "  📹 " $9 " - " $5}'
echo ""
echo "💡 Tips:"
echo "   - Dùng video 9:16 cho TikTok/Reels/Shorts"
echo "   - Dùng video 16:9 cho YouTube/Desktop"
echo "   - Fast animation phù hợp với attention span ngắn"
echo "   - Dark theme đẹp hơn cho highlight clip"
echo ""
echo "📖 Đọc thêm: examples/PREMIER_LEAGUE_DATA.md"
echo "=========================================================="
