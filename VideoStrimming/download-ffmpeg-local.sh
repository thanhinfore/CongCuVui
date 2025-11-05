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

# Tạo cấu trúc thư mục cho @ffmpeg packages
mkdir -p "@ffmpeg/ffmpeg" "@ffmpeg/util" "@ffmpeg/core"

echo "📦 Đang tải @ffmpeg/ffmpeg libraries..."
echo ""

# URLs cho @ffmpeg/ffmpeg
FFMPEG_VERSION="0.12.10"
FFMPEG_BASE="https://unpkg.com/@ffmpeg/ffmpeg@${FFMPEG_VERSION}/dist/esm"
FFMPEG_ALT="https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@${FFMPEG_VERSION}/dist/esm"

declare -A FFMPEG_FILES=(
    ["index.js"]="@ffmpeg/ffmpeg - index.js"
    ["classes.js"]="@ffmpeg/ffmpeg - classes.js"
)

success=true
for file in "${!FFMPEG_FILES[@]}"; do
    desc="${FFMPEG_FILES[$file]}"

    if ! download_file "$FFMPEG_BASE/$file" "@ffmpeg/ffmpeg/$file" "$desc"; then
        echo -e "    ${YELLOW}Thử CDN thay thế...${NC}"
        if ! download_file "$FFMPEG_ALT/$file" "@ffmpeg/ffmpeg/$file" "$desc"; then
            echo -e "    ${RED}Lỗi: Không thể tải $file${NC}"
            success=false
        fi
    fi
done

echo ""
echo "📦 Đang tải @ffmpeg/util libraries..."
echo ""

# URLs cho @ffmpeg/util
UTIL_VERSION="0.12.1"
UTIL_BASE="https://unpkg.com/@ffmpeg/util@${UTIL_VERSION}/dist/esm"
UTIL_ALT="https://cdn.jsdelivr.net/npm/@ffmpeg/util@${UTIL_VERSION}/dist/esm"

if ! download_file "$UTIL_BASE/index.js" "@ffmpeg/util/index.js" "@ffmpeg/util - index.js"; then
    echo -e "    ${YELLOW}Thử CDN thay thế...${NC}"
    if ! download_file "$UTIL_ALT/index.js" "@ffmpeg/util/index.js" "@ffmpeg/util - index.js"; then
        echo -e "    ${RED}Lỗi: Không thể tải @ffmpeg/util/index.js${NC}"
        success=false
    fi
fi

echo ""
echo "📦 Đang tải FFmpeg Core files..."
echo ""

# URLs cho FFmpeg core files
CORE_VERSION="0.12.6"
CORE_BASE="https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/esm"
CORE_ALT="https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/esm"

declare -A CORE_FILES=(
    ["ffmpeg-core.js"]="ffmpeg-core.js"
    ["ffmpeg-core.wasm"]="ffmpeg-core.wasm (file lớn, ~32MB)"
    ["ffmpeg-core.worker.js"]="ffmpeg-core.worker.js"
)

for file in "${!CORE_FILES[@]}"; do
    desc="${CORE_FILES[$file]}"

    if ! download_file "$CORE_BASE/$file" "@ffmpeg/core/$file" "$desc"; then
        echo -e "    ${YELLOW}Thử CDN thay thế...${NC}"
        if ! download_file "$CORE_ALT/$file" "@ffmpeg/core/$file" "$desc"; then
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
    ls -lh *.js *.wasm 2>/dev/null | awk '{print "  - "$9" ("$5")"}'
    echo ""
    echo "Bây giờ bạn có thể:"
    echo "  1. Chạy local server: python3 -m http.server 8000"
    echo "  2. Hoặc: npx serve ."
    echo "  3. Truy cập: http://localhost:8000"
else
    echo -e "${RED}✗ Có lỗi xảy ra khi tải files${NC}"
    echo ""
    echo "Vui lòng tải thủ công từ:"
    echo "  - @ffmpeg/ffmpeg: https://unpkg.com/@ffmpeg/ffmpeg@${FFMPEG_VERSION}/dist/esm/"
    echo "  - @ffmpeg/util: https://unpkg.com/@ffmpeg/util@${UTIL_VERSION}/dist/esm/"
    echo "  - @ffmpeg/core: https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/esm/"
    echo ""
    echo "Hoặc đọc file lib/HUONG_DAN.md để biết thêm chi tiết."
    exit 1
fi

cd ..
echo "================================================"
