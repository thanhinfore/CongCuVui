# Real Madrid vs Barcelona - Match Activity Analysis

## 📊 Dataset: `22_real_madrid_vs_barcelona_match_activity.csv`

Phân tích chi tiết hoạt động của cầu thủ trong trận **El Clásico** giữa Real Madrid vs Barcelona tại sân Santiago Bernabéu.

### ✨ Dataset Features

- **📅 Đầy đủ 92 phút liên tục**: Dữ liệu cho TỪNG phút từ 1' đến 92' (không có gap)
- **👥 15 cầu thủ chính**: Tracking các cầu thủ có impact cao nhất
- **📈 Cumulative scoring**: Điểm số tích lũy theo thời gian thực
- **🎯 Ultra-smooth animation**: Mượt mà hoàn toàn, không có hiện tượng "nhảy"

### 🎯 Điểm Nổi Bật

- **Tỷ số cuối cùng**: Real Madrid 2-1 Barcelona
- **Thời lượng**: 92 phút (90 phút + 12 phút injury time)
- **Khán giả**: 78,107 người
- **Thẻ đỏ**: 2 (Pedri - Barcelona, Andriy Lunin - Real Madrid)
- **Thẻ vàng**: 9 cầu thủ

### 📈 Hệ Thống Chấm Điểm "Match Impact Score"

Dataset này tracking điểm số tích lũy của mỗi cầu thủ dựa trên các hành động trong trận:

| Hành Động | Điểm |
|-----------|------|
| ⚽ **Ghi bàn (Goal)** | +10 |
| 🎯 **Kiến tạo (Assist)** | +5 |
| 🟥 **Thẻ đỏ (Red Card)** | +8 |
| 🟨 **Thẻ vàng (Yellow Card)** | +3 |
| 🎪 **Sút trúng đích (Shot on target - saved)** | +3 |
| 🧱 **Chặn bóng (Block)** | +2 |
| 🎲 **Sút trượt (Shot off target)** | +1 |
| 🛡️ **Đánh chặn thành công (Tackle won)** | +1 |
| 🧤 **Cứu thua (Save by keeper)** | +3 |
| 🔑 **Kiến tạo cơ hội nguy hiểm** | +2 |
| ⚡ **Phạm lỗi penalty** | +2 |

### 🌟 Top Performers (Điểm tích lũy cuối trận)

#### Real Madrid:
1. **Thibaut Courtois** (GK): 35 điểm - Man of the Match
   - 8 lần cứu thua quan trọng
   - Giữ sạch lưới hầu hết trận đấu

2. **Jude Bellingham**: 33 điểm
   - ⚽ 1 bàn thắng (phút 43')
   - 🎯 1 kiến tạo (cho Mbappe)
   - Nhiều pha dứt điểm nguy hiểm

3. **Kylian Mbappe**: 27 điểm
   - ⚽ 1 bàn thắng (phút 22')
   - ❌ 1 penalty bị bắt (phút 52')
   - 1 bàn thắng bị từ chối (VAR offside)

4. **Eder Militao**: 24 điểm
   - 🎯 1 kiến tạo (cho Bellingham)
   - 🟨 Thẻ vàng (phút 90+11')
   - Nhiều pha chặn bóng quan trọng

5. **Arda Guler**: 24 điểm
   - Nhiều pha đá phạt và corner nguy hiểm
   - Kiểm soát nhịp độ tấn công

#### Barcelona:
1. **Fermin Lopez**: 30 điểm
   - ⚽ 1 bàn thắng (phút 38')
   - 🟨 Thẻ vàng (phút 90+9')
   - 4 lần sút trúng đích

2. **Pedri**: 21 điểm
   - 🟨 Thẻ vàng (phút 42')
   - 🟥 Thẻ đỏ - 2 vàng (phút 90+10')
   - Kiểm soát bóng tốt ở khu trung tuyến

3. **Vinicius Junior**: 22 điểm (Real Madrid)
   - Kiến tạo cơ hội cho Bellingham
   - 🟨 Thẻ vàng (phút 90+11')
   - Nhiều pha đột phá nguy hiểm

4. **Marcus Rashford**: 18 điểm
   - 🎯 1 kiến tạo (cho Fermin Lopez)
   - 🟨 Thẻ vàng (phút 90+11')
   - Đá corner và tạo cơ hội

5. **Eric Garcia**: 14 điểm
   - ⚡ Phạm lỗi penalty (phút 51' - VAR)
   - Nhiều pha chặn bóng

### ⚽ Diễn Biến Bàn Thắng

**Phút 22' - Real Madrid 1-0 Barcelona**
- ⚽ Kylian Mbappe
- 🎯 Kiến tạo: Jude Bellingham
- Bàn mở tỷ số sau pha phản công nhanh

**Phút 38' - Real Madrid 1-1 Barcelona**
- ⚽ Fermin Lopez
- 🎯 Kiến tạo: Marcus Rashford
- Bàn gỡ hòa từ sai lầm của Arda Guler

**Phút 43' - Real Madrid 2-1 Barcelona**
- ⚽ Jude Bellingham
- 🎯 Kiến tạo: Eder Militao (từ đường chuyền của Vinicius Jr)
- Bàn thắng quyết định trước khi vào giải lao

### 🔥 Những Khoảnh Khắc Đáng Nhớ

**Phút 12'**: Mbappe ghi bàn nhưng bị từ chối vì offside (VAR)

**Phút 51-52'**: Eric Garcia phạm lỗi tay trong vòng cấm (VAR) → Penalty cho Real Madrid → **Mbappe sút hỏng** (Szczesny cản phá)

**Phút 90+10'**: Pedri nhận thẻ vàng thứ 2 → Thẻ đỏ trực tiếp → Barcelona chơi thiếu người

**Phút 90+11'**: Đại hỗn chiến!
- Andriy Lunin (GK Real Madrid) nhận thẻ đỏ vì phản ứng với trọng tài
- 6 cầu thủ khác nhận thẻ vàng cùng lúc (Militao, Vinicius, Rodrygo, Balde, Ferran Torres, Fermin Lopez)

### 📊 Thống Kê Chi Tiết

| Chỉ số | Real Madrid | Barcelona |
|--------|-------------|-----------|
| Kiểm soát bóng | 31% | 69% |
| Bàn thắng | 2 | 1 |
| Penalty hụt | 1 | 0 |
| Thẻ vàng | 5 | 4 |
| Thẻ đỏ | 1 (Lunin - GK) | 1 (Pedri) |
| Bàn thắng bị từ chối | 1 (Mbappe) | 0 |

### 🎬 Cách Tạo Video

#### Video đơn giản (10 giây/phút):
```bash
python TimeSeriesRacing.py \
  --data "examples/sports_data/22_real_madrid_vs_barcelona_match_activity.csv" \
  --output "real_madrid_vs_barcelona_activity.mp4" \
  --title "Real Madrid vs Barcelona - Match Activity (El Clásico)" \
  --top-n 10 \
  --fps 60 \
  --period-length 200
```

#### Video Ultra HD với custom styling:
```bash
python TimeSeriesRacing.py \
  --data "examples/sports_data/22_real_madrid_vs_barcelona_match_activity.csv" \
  --output "el_clasico_ultra_hd.mp4" \
  --title "⚽ Real Madrid 2-1 Barcelona | El Clásico Live Activity Tracker" \
  --top-n 12 \
  --fps 60 \
  --period-length 300 \
  --dpi 200 \
  --bar-style gradient \
  --theme light \
  --palette "sports" \
  --font-family sans-serif
```

#### Video nhanh (highlight 90 phút trong 30 giây):
```bash
python TimeSeriesRacing.py \
  --data "examples/sports_data/22_real_madrid_vs_barcelona_match_activity.csv" \
  --output "el_clasico_highlights.mp4" \
  --title "El Clásico in 30 Seconds | Real Madrid 2-1 Barcelona" \
  --top-n 8 \
  --fps 60 \
  --period-length 50 \
  --bar-style modern
```

### 💡 Ý Tưởng Nội Dung Viral

1. **"Real-time Match Activity Tracker"** 🔴
   - Hiển thị điểm hoạt động của cầu thủ theo từng phút
   - Thêm emoji cảm xúc khi có bàn thắng/thẻ phạt
   - Kèm commentary quan trọng

2. **"Top 10 Most Active Players in El Clásico"** ⭐
   - Focus vào top 10 cầu thủ tích cực nhất
   - Highlight khi có sự kiện quan trọng (goal, red card)

3. **"Goalkeeper Battle: Courtois vs Szczesny"** 🧤
   - So sánh 2 thủ môn
   - Tracking số lần cứu thua, bàn thua, thẻ phạt

4. **"Mbappe vs Rashford: Individual Duel"** ⚡
   - Head-to-head comparison
   - Ai ảnh hưởng nhiều hơn đến trận đấu?

5. **"The Red Card Chaos (Minute 90+)"** 🟥
   - Focus vào 12 phút injury time
   - Dramatic ending với 2 thẻ đỏ và 6 thẻ vàng

### 🎯 Khán Giả Mục Tiêu

- **Football/Soccer fans** - Đặc biệt là fan Real Madrid và Barcelona
- **Sports analytics enthusiasts** - Người yêu thích data visualization
- **Social media content creators** - TikTok, Instagram Reels, YouTube Shorts
- **Sports journalists** - Phân tích và báo cáo trận đấu

### 📱 Nền Tảng Phát Hành

- **YouTube**: Full video (1-2 phút) với commentary
- **TikTok/Reels**: 15-30 giây highlights
- **Twitter/X**: 60 giây với key moments
- **Facebook**: 1-2 phút full experience

### 🔍 Hashtags Gợi Ý

```
#ElClasico #RealMadrid #Barcelona #Mbappe #Bellingham #MatchAnalysis
#FootballStats #SoccerData #LaLiga #RealMadridVsBarcelona #DataViz
#SportsAnalytics #BarChartRace #FootballHighlights #SoccerHighlights
```

### 📊 Dữ Liệu Bổ Sung

Dataset này có thể được mở rộng với:
- Heatmap vị trí cầu thủ
- Pass completion rates
- Distance covered
- Sprint statistics
- xG (Expected Goals) progression
- Individual duels won/lost

### 🎓 Phân Tích Chuyên Sâu

**Tại sao Courtois có điểm cao nhất?**
- Thủ môn có nhiều cơ hội thể hiện (Barcelona kiểm soát bóng 69%)
- 8 lần cứu thua quan trọng giữ lại chiến thắng 2-1
- Real Madrid chơi phòng ngự phản công → Courtois là người hùng thầm lặng

**Tại sao Barcelona thua dù kiểm soát bóng 69%?**
- Hiệu quả dứt điểm kém hơn Real Madrid
- Pedri nhận thẻ đỏ (phút 90+10) → chơi thiếu người
- Mất tập trung ở 2 bàn thua (phút 22 và 43)
- Phạm lỗi penalty nhưng Mbappe sút hỏng (may mắn)

**MVP của trận đấu?**
- **Thibaut Courtois** (35 điểm): Cứu thua nhiều nhất, giữ chiến thắng cho Real Madrid
- **Jude Bellingham** (33 điểm): 1 bàn + 1 kiến tạo, toàn diện nhất
- **Fermin Lopez** (30 điểm): Cầu thủ hay nhất Barcelona, 1 bàn thắng quan trọng

### 📝 Notes

- **✅ Dataset hoàn chỉnh**: 92 phút liên tục từ 1' đến 92' (không có gap, ultra-smooth animation)
- Dataset tracking 15 cầu thủ chính có impact cao nhất
- Điểm số được cập nhật theo từng phút (real-time simulation)
- Các phút không có sự kiện: điểm số giữ nguyên (carry forward)
- Không bao gồm cầu thủ vào sân thay thế muộn (< 5 phút)
- Dữ liệu dựa trên match commentary chi tiết

---

**Nguồn**: Match commentary từ trận Real Madrid vs Barcelona tại Estadio Santiago Bernabeu
**Tỷ số chính thức**: Real Madrid 2-1 Barcelona
**Attendance**: 78,107
**Weather**: Cloudy
**Pitch condition**: Fantastic

🤖 Dataset created for TimeSeriesRacing v3.0 - Ultra HD Bar Chart Race Videos
