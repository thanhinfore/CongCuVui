# Color Palettes & Style Presets - TimeSeriesRacing v2.0

Hướng dẫn sử dụng các color palettes và style presets để tạo video đẹp và chuyên nghiệp.

## 🎨 Color Palettes

TimeSeriesRacing v2.0 có 8 bộ màu chuyên nghiệp được thiết kế sẵn:

### 1. **Professional** (Mặc định)
Bộ màu chuyên nghiệp, sang trọng, phù hợp cho báo cáo và presentation.

```bash
--palette professional
```

**Màu sắc**: Xanh navy, đỏ burgundy, cam đậm, xanh lá, tím...
**Phù hợp**: Báo cáo doanh nghiệp, presentation học thuật, analysis chuyên sâu

### 2. **Vibrant**
Bộ màu sống động, tươi sáng, bắt mắt.

```bash
--palette vibrant
```

**Màu sắc**: Đỏ coral, xanh turquoise, xanh dương, cam pastel, vàng...
**Phù hợp**: Content marketing, social media, giải trí

### 3. **Neon**
Bộ màu neon, rực rỡ, hiện đại, năng động.

```bash
--palette neon
```

**Màu sắc**: Hồng neon, cam neon, vàng neon, tím neon, xanh neon...
**Phù hợp**: TikTok, Reels, content viral, gaming, tech

### 4. **Pastel**
Bộ màu nhẹ nhàng, dịu dàng, dễ nhìn.

```bash
--palette pastel
```

**Màu sắc**: Hồng pastel, xanh mint, vàng kem, tím lavender...
**Phù hợp**: Beauty, lifestyle, fashion, wellness

### 5. **Ocean**
Bộ màu biển cả, xanh dương và vàng cam.

```bash
--palette ocean
```

**Màu sắc**: Xanh navy đậm, xanh biển, xanh nhạt, cam vàng...
**Phù hợp**: Travel, nature, environment, water sports

### 6. **Sunset**
Bộ màu hoàng hôn, gradient từ hồng đến xanh.

```bash
--palette sunset
```

**Màu sắc**: Hồng magenta, tím violet, xanh dương, xanh cyan...
**Phù hợp**: Creative content, art, photography, music

### 7. **Earth**
Bộ màu trung tính, nâu xám, ấm áp.

```bash
--palette earth
```

**Màu sắc**: Nâu, xám, be, charcoal...
**Phù hợp**: History, documentary, vintage content

### 8. **Football**
Bộ màu thể thao, rực rỡ và năng động.

```bash
--palette football
```

**Màu sắc**: Đỏ, xanh royal, vàng gold, cam, xanh cyan...
**Phù hợp**: Sports content, Premier League data, competitions

---

## 🎬 Style Presets

Presets tự động cấu hình tất cả parameters để tối ưu cho từng platform.

### 1. **TikTok Preset**

Tối ưu cho video TikTok/Shorts viral.

```bash
python TimeSeriesRacing.py data.csv --preset tiktok --title "Trending Data"
```

**Auto config**:
- Tỷ lệ: 9:16 (Portrait)
- Palette: Neon
- Bar style: Gradient
- Period length: 300ms (Fast)
- Steps per period: 15 (Smooth)
- Animation: Rất nhanh, bắt mắt

**Phù hợp**: TikTok, YouTube Shorts, Instagram Reels

### 2. **YouTube Preset**

Tối ưu cho video YouTube dài hơi.

```bash
python TimeSeriesRacing.py data.csv --preset youtube --title "Data Analysis"
```

**Auto config**:
- Tỷ lệ: 16:9 (Landscape)
- Palette: Professional
- Bar style: Solid
- Period length: 500ms (Medium)
- Steps per period: 12 (Smooth)
- Animation: Vừa phải, professional

**Phù hợp**: YouTube, website embed, presentation

### 3. **Instagram Preset**

Tối ưu cho Instagram Reels.

```bash
python TimeSeriesRacing.py data.csv --preset instagram --title "Insta Ready"
```

**Auto config**:
- Tỷ lệ: 9:16 (Portrait)
- Palette: Pastel
- Bar style: Gradient
- Period length: 400ms (Medium-Fast)
- Steps per period: 15 (Smooth)
- Animation: Nhẹ nhàng, aesthetic

**Phù hợp**: Instagram Reels, Instagram Stories

### 4. **Presentation Preset**

Tối ưu cho slides và presentation.

```bash
python TimeSeriesRacing.py data.csv --preset presentation --title "Q4 Report"
```

**Auto config**:
- Tỷ lệ: 16:9 (Landscape)
- Palette: Professional
- Bar style: Solid
- Period length: 600ms (Slow)
- Steps per period: 10 (Standard)
- Animation: Chậm rãi, dễ theo dõi

**Phù hợp**: PowerPoint, Google Slides, meetings

---

## 💡 Ví dụ sử dụng

### Example 1: TikTok Video Viral

```bash
python TimeSeriesRacing.py examples/premier_league_trophies_wide.csv \
  --preset tiktok \
  --title "Premier League Trophy Race ⚽🔥" \
  --top 8 \
  --output tiktok_viral.mp4
```

### Example 2: YouTube Video Chuyên Nghiệp

```bash
python TimeSeriesRacing.py examples/sample_coding.csv \
  --preset youtube \
  --title "Evolution of Programming Languages (2015-2024)" \
  --top 10 \
  --output youtube_pro.mp4
```

### Example 3: Custom Palette với Neon

```bash
python TimeSeriesRacing.py data.csv \
  --palette neon \
  --bar-style gradient \
  --ratio 9:16 \
  --title "Neon Racing 🌟" \
  --output neon_video.mp4
```

### Example 4: Ocean Theme cho Travel Content

```bash
python TimeSeriesRacing.py travel_data.csv \
  --palette ocean \
  --bar-style gradient \
  --title "Top Travel Destinations 2024 🌊" \
  --top 10 \
  --output ocean_travel.mp4
```

### Example 5: Football Palette cho Sports

```bash
python TimeSeriesRacing.py examples/premier_league_trophies_long.csv \
  --palette football \
  --bar-style gradient \
  --title "English Football Glory Race ⚽" \
  --ratio 16:9 \
  --top 10 \
  --output football_glory.mp4
```

---

## 🎯 So sánh Palettes

| Palette | Phong cách | Use Case | Độ nổi bật | Tính chuyên nghiệp |
|---------|------------|----------|------------|-------------------|
| **Professional** | Sang trọng | Business, Academic | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Vibrant** | Tươi sáng | Marketing, Social | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Neon** | Rực rỡ | TikTok, Gaming | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Pastel** | Nhẹ nhàng | Beauty, Lifestyle | ⭐⭐ | ⭐⭐⭐⭐ |
| **Ocean** | Biển cả | Travel, Nature | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Sunset** | Nghệ thuật | Creative, Art | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Earth** | Trung tính | History, Vintage | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Football** | Thể thao | Sports, Competition | ⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## 🚀 Tips & Best Practices

### 1. Chọn Palette phù hợp với nội dung

- **Dữ liệu nghiêm túc**: Professional, Earth
- **Content viral**: Neon, Vibrant
- **Aesthetic content**: Pastel, Sunset
- **Thể thao**: Football, Vibrant
- **Travel**: Ocean, Sunset

### 2. Chọn Bar Style

- **Gradient**: Đẹp hơn, hiện đại, phù hợp social media
- **Solid**: Chuyên nghiệp hơn, dễ đọc, phù hợp presentation

### 3. Tối ưu theo Platform

| Platform | Preset | Ratio | Duration | Tips |
|----------|--------|-------|----------|------|
| TikTok | tiktok | 9:16 | 15-60s | Nhanh, neon, hooks mạnh |
| YouTube | youtube | 16:9 | 2-10min | Chậm hơn, professional |
| Instagram | instagram | 9:16 | 15-90s | Pastel, aesthetic |
| Presentation | presentation | 16:9 | Tùy | Chậm, dễ đọc |

### 4. Kết hợp Palette và Title

```bash
# Good example - Matching style
python TimeSeriesRacing.py data.csv \
  --palette neon \
  --title "🔥 TOP TRENDING TOPICS 2024 🚀"

# Good example - Professional
python TimeSeriesRacing.py data.csv \
  --palette professional \
  --title "Q4 2024 Revenue Analysis"
```

### 5. Testing và A/B Testing

Thử nhiều palette để tìm ra cái phù hợp nhất:

```bash
# Test 3 versions
python TimeSeriesRacing.py data.csv --palette neon --output test_neon.mp4
python TimeSeriesRacing.py data.csv --palette vibrant --output test_vibrant.mp4
python TimeSeriesRacing.py data.csv --palette ocean --output test_ocean.mp4
```

---

## 🎨 Advanced: Mixing Parameters

Bạn có thể mix preset với custom parameters:

```bash
# Bắt đầu với preset, sau đó override
python TimeSeriesRacing.py data.csv \
  --preset tiktok \
  --palette ocean \
  --title "Custom TikTok Video" \
  --top 8
```

Trong trường hợp này:
- Preset TikTok áp dụng: 9:16, fast animation, 15 steps
- Nhưng palette được override thành ocean (thay vì neon)

---

## 📊 Kết luận

**Cho TikTok/Viral**:
```bash
--preset tiktok --palette neon
```

**Cho YouTube**:
```bash
--preset youtube --palette professional
```

**Cho Instagram**:
```bash
--preset instagram --palette pastel
```

**Cho Presentation**:
```bash
--preset presentation --palette professional
```

**Cho Sports Content**:
```bash
--palette football --bar-style gradient --ratio 16:9
```

Happy racing! 🎥✨
