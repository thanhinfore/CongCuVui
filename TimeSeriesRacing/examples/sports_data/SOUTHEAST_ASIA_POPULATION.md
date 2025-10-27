# Southeast Asia Population Dataset (1945-2024)

Dữ liệu dân số 11 quốc gia Đông Nam Á từ sau Thế Chiến 2 đến nay.

## 📊 Dataset: `21_southeast_asia_population.csv`

### Thông tin chung
- **Khoảng thời gian**: 1945 - 2024 (80 năm)
- **Tần suất**: Mỗi 5 năm (17 data points)
- **Đơn vị**: Triệu người (millions)
- **Nguồn**: UN Population Division, World Bank, National Statistics

### 11 Quốc gia được track

| Quốc gia | 1945 | 2024 | Tăng trưởng |
|----------|------|------|-------------|
| **Indonesia** 🇮🇩 | 70.5M | 277.5M | **+294%** |
| **Vietnam** 🇻🇳 | 23.0M | 98.9M | **+330%** |
| **Philippines** 🇵🇭 | 18.5M | 117.3M | **+534%** |
| **Thailand** 🇹🇭 | 17.8M | 71.8M | **+303%** |
| **Myanmar** 🇲🇲 | 16.8M | 54.6M | **+225%** |
| **Malaysia** 🇲🇾 | 5.8M | 34.3M | **+491%** |
| **Cambodia** 🇰🇭 | 4.5M | 17.3M | **+284%** |
| **Laos** 🇱🇦 | 1.9M | 7.6M | **+300%** |
| **Singapore** 🇸🇬 | 0.9M | 6.0M | **+567%** |
| **Brunei** 🇧🇳 | 0.04M | 0.46M | **+1050%** |
| **Timor-Leste** 🇹🇱 | 0.43M | 1.37M | **+219%** |

### Tổng dân số khu vực
- **1945**: ~160 triệu người
- **2024**: ~687 triệu người
- **Tăng trưởng**: **+329%** trong 80 năm

## 🌟 Highlights & Milestones

### Indonesia - Nước đông dân nhất SEA
```
1945: 70.5M (44% dân số SEA)
1967: Suharto lên nắm quyền
1998: Reformasi, Suharto từ chức
2024: 277.5M (40% dân số SEA)
```
**Luôn là số 1 khu vực**, chiếm ~40% dân số Đông Nam Á

### Vietnam - Tăng trưởng ấn tượng
```
1945: 23M (sau WW2)
1975: 48M (thống nhất đất nước)
1986: Đổi mới
2000: 77.6M (baby boom era ends)
2024: 98.9M (sắp cán mốc 100M!)
```
**Tăng gấp 4.3 lần**, từ 23M → 99M

### Philippines - Tăng trưởng nhanh nhất (lớn)
```
1945: 18.5M
1986: Marcos rời Philippines
2000: 77.9M (vượt Vietnam!)
2024: 117.3M
```
**Tăng +534%!** Nhanh nhất trong các nước lớn

### Thailand - Phát triển ổn định
```
1945: 17.8M
1997: Khủng hoảng tài chính châu Á
2024: 71.8M
```
Tăng trưởng đều đặn, **+303%**

### Myanmar - Tăng chậm hơn
```
1945: 16.8M
1988: 8888 Uprising
2021: Đảo chính quân sự
2024: 54.6M
```
Tăng **+225%**, chậm nhất trong big 5

### Malaysia - Phát triển mạnh
```
1945: 5.8M
1963: Thành lập Malaysia
1965: Singapore tách ra
2024: 34.3M
```
**Tăng +491%**, từ 5.8M → 34.3M

### Singapore - Tiny but mighty
```
1945: 0.9M (sau WW2, British rule)
1965: 1.9M (độc lập từ Malaysia)
2024: 6.0M
```
**Tăng +567%!** Nhỏ nhưng tăng trưởng cao

### Cambodia - Khmer Rouge tragedy
```
1945: 4.5M
1975-1979: Khmer Rouge (genocide)
1975: 6.0M → giảm xuống ~5M
1990s: Phục hồi
2024: 17.3M
```
**Duy nhất có giai đoạn giảm dân số** (1975-1979)

### Timor-Leste - Newest nation
```
1945: 0.43M (thuộc Indonesia từ 1975)
2002: 0.80M (độc lập!)
2024: 1.37M
```
**Độc lập 2002**, nước nhỏ nhất SEA

## 📈 Tốc độ tăng trưởng theo thời kỳ

### 1945-1975: Baby Boom Era (post-WW2)
- Vietnam: 23M → 48M (**+109%**)
- Philippines: 18.5M → 42M (**+127%**)
- Indonesia: 70M → 130M (**+86%**)

### 1975-2000: Developing Era
- Vietnam: 48M → 77.6M (+62%)
- Philippines: 42M → 77.9M (+85%)
- Malaysia: 12.3M → 23.4M (+90%)

### 2000-2024: Modern Era (slowing growth)
- Philippines: 77.9M → 117.3M (+51%)
- Vietnam: 77.6M → 98.9M (+27%)
- Indonesia: 211M → 277M (+31%)

**Trend**: Tốc độ tăng trưởng đang chậm lại ở hầu hết các nước (trừ Philippines)

## 🎬 Tạo Video với TimeSeriesRacing

### TikTok/Reels (9:16 Portrait)
```bash
python TimeSeriesRacing.py \
  examples/sports_data/21_southeast_asia_population.csv \
  --title "Dân số Đông Nam Á 1945-2024 🌏" \
  --preset tiktok \
  --dpi 200 \
  --top 11 \
  --output sea_population_tiktok.mp4
```

### YouTube (16:9 Landscape)
```bash
python TimeSeriesRacing.py \
  examples/sports_data/21_southeast_asia_population.csv \
  --title "Southeast Asia Population Race (1945-2024)" \
  --preset youtube \
  --dpi 200 \
  --palette ocean \
  --output sea_population_youtube.mp4
```

### Ultra HD (Maximum quality)
```bash
python TimeSeriesRacing.py \
  examples/sports_data/21_southeast_asia_population.csv \
  --title "Dân số ASEAN: 80 năm phát triển 📊" \
  --dpi 300 \
  --fps 60 \
  --palette professional \
  --ratio 16:9 \
  --output sea_population_uhd.mp4
```

### Instagram (Aesthetic)
```bash
python TimeSeriesRacing.py \
  examples/sports_data/21_southeast_asia_population.csv \
  --title "ASEAN Population Growth 🌏✨" \
  --preset instagram \
  --palette pastel \
  --top 8 \
  --output sea_population_ig.mp4
```

## 💡 Video Ideas

### 1. Full Timeline (1945-2024)
**Hook**: "80 năm thay đổi dân số Đông Nam Á"
- Shows post-WW2 recovery
- Baby boom era
- Modern development
- Current rankings

### 2. Modern Era (2000-2024)
**Hook**: "Ai tăng nhanh nhất 25 năm qua?"
- Focus on recent changes
- Philippines overtaking Vietnam
- Singapore's growth
- ASEAN integration era

### 3. Independence Stories
**Hook**: "Từ thuộc địa đến độc lập"
- 1945: Post-colonial era
- 1960s: Independence wave
- 2002: Timor-Leste newest nation

### 4. Top 5 Only
**Hook**: "Big 5 ASEAN Population Race"
```bash
--top 5
```
Focus on: Indonesia, Vietnam, Philippines, Thailand, Myanmar

## 📊 Interesting Facts

1. **Indonesia luôn #1**: Chiếm ~40% dân số SEA suốt 80 năm
2. **Philippines vượt Vietnam**: Năm 2000, Philippines vượt Vietnam về dân số
3. **Singapore tăng +567%**: Cao nhất khu vực (dù dân số nhỏ)
4. **Cambodia Tragedy**: Duy nhất có giai đoạn giảm dân số (Khmer Rouge)
5. **Timor-Leste**: Nước mới nhất (độc lập 2002)
6. **Vietnam sắp 100M**: Sẽ đạt 100 triệu dân vào 2025-2026
7. **Philippines sắp vượt 120M**: Tăng trưởng nhanh nhất trong big 3

## 🌍 Regional Context

### ASEAN (2024)
- **Tổng dân số**: ~687 triệu người
- **Ranking thế giới**: #3 (sau China, India)
- **GDP**: $3.6 trillion
- **Trung bình tuổi**: ~31 (trẻ!)

### So với các khu vực khác (2024)
- ASEAN: 687M
- Châu Âu: 750M
- Bắc Mỹ: 580M
- Nam Mỹ: 440M
- Trung Đông: 410M

**ASEAN là khu vực trẻ, đông dân, đang phát triển nhanh!**

## 📚 Data Sources

- UN Population Division (World Population Prospects)
- World Bank Open Data
- National Statistics Offices
- ASEAN Statistics

**Note**: Số liệu 1945-1950 là ước tính dựa trên census và historical records

## 🎯 Use Cases

1. **Education**: Dạy về lịch sử, địa lý SEA
2. **Demographics**: Phân tích xu hướng dân số
3. **Economics**: Liên hệ dân số với phát triển kinh tế
4. **Social Media**: Viral content về ASEAN
5. **Presentations**: Business, government, academic

## 🔥 Viral Potential

**High!** Because:
- ✅ Covers 11 countries (broad appeal)
- ✅ 80 years of drama (independence, wars, development)
- ✅ Clear winner (Indonesia always #1)
- ✅ Surprising overtakes (Philippines > Vietnam)
- ✅ Tragedy (Cambodia Khmer Rouge visible)
- ✅ Success stories (Singapore +567%!)
- ✅ Regional pride (ASEAN unity)

**Best platforms**: TikTok, YouTube, Instagram
**Target audience**: Southeast Asians, history buffs, geography fans
**Estimated views**: 100K-1M+ (with good title/thumbnail)

---

**Created for TimeSeriesRacing v3.0**
*Bringing Southeast Asian demographics to life! 🌏*
