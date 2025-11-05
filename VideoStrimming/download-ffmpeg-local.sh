#!/bin/bash

# Script tải FFmpeg libraries cho VideoStrimming
# Chạy script này từ thư mục VideoStrimming

set -e

echo "================================================"
echo "  VideoStrimming - FFmpeg Local Setup"
echo "================================================"
echo ""

# Màu sắc cho output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Tạo thư mục lib nếu chưa có
mkdir -p lib
cd lib

echo "📦 Đang tải FFmpeg Core files..."
echo ""

# Function để tải file với retry
download_file() {
    local url=$1
    local output=$2
    local description=$3

    echo -n "  Đang tải $description... "

    # Thử với curl
    if command -v curl &> /dev/null; then
        if curl -# -L -f -o "$output" "$url" 2>/dev/null; then
            echo -e "${GREEN}✓${NC}"
            return 0
        fi
    fi

    # Thử với wget
    if command -v wget &> /dev/null; then
        if wget -q --show-progress -O "$output" "$url" 2>/dev/null; then
            echo -e "${GREEN}✓${NC}"
            return 0
        fi
    fi

    echo -e "${RED}✗${NC}"
    return 1
}

# URLs cho FFmpeg core files
CORE_VERSION="0.12.6"
BASE_URL="https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/esm"
ALT_BASE_URL="https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/esm"

# Mảng các file cần tải
declare -A FILES=(
    ["ffmpeg-core.js"]="ffmpeg-core.js"
    ["ffmpeg-core.wasm"]="ffmpeg-core.wasm (file lớn nhất, ~32MB)"
    ["ffmpeg-core.worker.js"]="ffmpeg-core.worker.js"
)

# Tải từng file
success=true
for file in "${!FILES[@]}"; do
    desc="${FILES[$file]}"

    # Thử URL chính
    if ! download_file "$BASE_URL/$file" "$file" "$desc"; then
        echo -e "    ${YELLOW}Thử CDN thay thế...${NC}"
        # Thử URL thay thế
        if ! download_file "$ALT_BASE_URL/$file" "$file" "$desc"; then
            echo -e "    ${RED}Lỗi: Không thể tải $file${NC}"
            success=false
        fi
    fi
done

echo ""
echo "================================================"

if [ "$success" = true ]; then
    echo -e "${GREEN}✓ Hoàn tất!${NC}"
    echo ""
    echo "Các file đã tải:"
    ls -lh ffmpeg-core.* 2>/dev/null | awk '{print "  - "$9" ("$5")"}'
    echo ""
    echo "Bây giờ bạn có thể:"
    echo "  1. Chạy local server: python3 -m http.server 8000"
    echo "  2. Hoặc: npx serve ."
    echo "  3. Truy cập: http://localhost:8000"
else
    echo -e "${RED}✗ Có lỗi xảy ra khi tải files${NC}"
    echo ""
    echo "Vui lòng tải thủ công từ:"
    echo "  https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/esm/"
    echo ""
    echo "Hoặc đọc file lib/HUONG_DAN.md để biết thêm chi tiết."
    exit 1
fi

cd ..
echo "================================================"
