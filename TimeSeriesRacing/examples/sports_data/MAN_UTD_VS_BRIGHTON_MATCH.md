# Manchester United vs Brighton - Match Activity Analysis

## 📊 Dataset: `23_man_utd_vs_brighton_match_activity.csv`

Phân tích chi tiết hoạt động của cầu thủ trong trận **Manchester United vs Brighton** tại sân Old Trafford.

### ✨ Dataset Features

- **📅 Đầy đủ 98 phút liên tục**: Dữ liệu cho TỪNG phút từ 1' đến 98' (90' + 8' injury time)
- **👥 15 cầu thủ chính**: Tracking các cầu thủ có impact cao nhất từ cả 2 đội
- **📈 Cumulative scoring**: Điểm số tích lũy theo thời gian thực
- **🎯 Ultra-smooth animation**: Mượt mà hoàn toàn, không có hiện tượng "nhảy"

### 🎯 Điểm Nổi Bật

- **Tỷ số cuối cùng**: Manchester United 4-2 Brighton
- **Thời lượng**: 98 phút (90 phút + 8 phút injury time)
- **Địa điểm**: Old Trafford
- **Thời tiết**: Cold day
- **Sân**: Fantastic condition
- **Thẻ vàng**: 3 cầu thủ (Benjamin Sesko, Carlos Baleba, Ferdi Kadioglu, Patrick Dorgu)

### 📈 Hệ Thống Chấm Điểm "Match Impact Score"

Dataset này tracking điểm số tích lũy của mỗi cầu thủ dựa trên các hành động trong trận:

| Hành Động | Điểm |
|-----------|------|
| ⚽ **Ghi bàn (Goal)** | +10 |
| 🎯 **Kiến tạo (Assist)** | +5 |
| 🟨 **Thẻ vàng (Yellow Card)** | +3 |
| 🎪 **Sút trúng đích (Shot on target - saved)** | +3 |
| 🧱 **Chặn bóng (Block)** | +2 |
| 🎲 **Sút trượt (Shot off target)** | +1 |
| 🛡️ **Đánh chặn thành công (Tackle won)** | +1 |
| 🧤 **Cứu thua (Save by keeper)** | +3 |
| 🔑 **Key pass** | +2 |
| ⚡ **Defensive blunder** | +1 |
| 🚫 **Clearance** | +1 |

### 🌟 Top Performers (Điểm tích lũy cuối trận)

#### Manchester United:
1. **Bryan Mbeumo**: 37 điểm - Man of the Match!
   - ⚽⚽ 2 bàn thắng (phút 61', 90+6')
   - 🎪 Nhiều shots on target (1 vào cột dọc)
   - 🔑 Key passes và create chances

2. **Casemiro**: 24 điểm
   - ⚽ 1 bàn thắng (phút 34')
   - 🎯 1 kiến tạo (phút 24' cho Matheus Cunha)
   - 🛡️ Nhiều tackles và interceptions quan trọng

3. **Matheus Cunha**: 20 điểm
   - ⚽ 1 bàn thắng (phút 24')
   - 🎯 1 kiến tạo (phút 48')
   - 🎪 Shots on target

4. **Benjamin Sesko**: 14 điểm
   - 🎯 1 kiến tạo (phút 61' cho Bryan Mbeumo)
   - 🟨 Thẻ vàng (phút 81')
   - Aerial duels và shots

5. **Bruno Fernandes**: 11 điểm
   - 🔑 Key pass (phút 24')
   - 🎪 Nhiều shots on target (saves)
   - 🛡️ Tackles và blocks

#### Brighton:
1. **Danny Welbeck**: 27 điểm
   - ⚽ 1 bàn thắng tuyệt đẹp (phút 74' - Direct free kick!)
   - 🎪 Nhiều shots on target
   - 🔑 Create chances và key passes

2. **Charalampos Kostoulas**: 13 điểm (substitute)
   - ⚽ 1 bàn thắng (phút 90+2')
   - 🎪 Shot blocked trước đó
   - Impact cao dù vào sân muộn (phút 79')

3. **Senne Lammens** (Man Utd GK): 21 điểm
   - 🧤 6 lần cứu thua quan trọng
   - Clean performance despite 2 goals conceded

4. **James Milner**: 8 điểm (substitute)
   - 🎯 1 kiến tạo (phút 90+2' cho Kostoulas)
   - Corners và clearances

5. **Carlos Baleba**: 10 điểm
   - 🟨 Thẻ vàng (phút 41' - tactical foul)
   - 🛡️ Nhiều tackles và interceptions

### ⚽ Diễn Biến Bàn Thắng

**Phút 24' - Manchester United 1-0 Brighton**
- ⚽ Matheus Cunha
- 🎯 Kiến tạo: Casemiro
- 🔑 Key pass: Bruno Fernandes
- Tình huống: Shot from outside the box, right foot

**Phút 34' - Manchester United 2-0 Brighton**
- ⚽ Casemiro
- 🎯 Kiến tạo: Luke Shaw
- Tình huống: Right foot shot with deflection
- Note: Jan Paul van Hecke bad execution led to goal

**Phút 61' - Manchester United 3-0 Brighton**
- ⚽ Bryan Mbeumo
- 🎯 Kiến tạo: Benjamin Sesko
- Tình huống: Left foot finish

**Phút 74' - Manchester United 3-1 Brighton**
- ⚽ Danny Welbeck
- Tình huống: **DIRECT FREE KICK** - curled into the back of the net!
- Right foot wonder strike

**Phút 90+2' - Manchester United 3-2 Brighton**
- ⚽ Charalampos Kostoulas (substitute)
- 🎯 Kiến tạo: James Milner
- Tình huống: Header from corner

**Phút 90+6' - Manchester United 4-2 Brighton**
- ⚽ Bryan Mbeumo (second goal!)
- 🎯 Kiến tạo: Ayden Heaven
- Tình huống: Left foot finish

### 🔥 Những Khoảnh Khắc Đáng Nhớ

**Phút 1'**: Bruno Fernandes header goes wide from Bryan Mbeumo cross - early chance!

**Phút 24'**: Bruno Fernandes key pass → Casemiro → **Matheus Cunha GOAL!** Beautiful team play

**Phút 34'**: Jan Paul van Hecke blunder → Luke Shaw → **Casemiro GOAL!** Lucky deflection

**Phút 41'**: Carlos Baleba tactical foul on Bryan Mbeumo → Yellow card

**Phút 71'**: Bryan Mbeumo shot hits the post! So close to second goal

**Phút 72'**: Patrick Dorgu yellow card for foul on Yankuba Minteh

**Phút 74'**: **Danny Welbeck WONDER FREE KICK!** Curled directly into the net - unstoppable!

**Phút 81'**: Benjamin Sesko yellow card for dangerous challenge on Jan Paul van Hecke

**Phút 90+2'**: James Milner corner → **Charalampos Kostoulas HEADER!** Brighton fight back

**Phút 90+4'**: Ferdi Kadioglu yellow card for tactical foul on Bryan Mbeumo

**Phút 90+6'**: Ayden Heaven assist → **Bryan Mbeumo SEALS IT!** 4-2 game over

**Phút 90+8'**: Danny Welbeck final shot goes wide - Full time!

### 📊 Thống Kê Chi Tiết

| Chỉ số | Manchester United | Brighton |
|--------|-------------------|----------|
| Kiểm soát bóng | 43% | 57% |
| Bàn thắng | 4 | 2 |
| Shots on target | Nhiều | Nhiều |
| Thẻ vàng | 2 (Sesko, Dorgu) | 2 (Baleba, Kadioglu) |
| Corners | Nhiều | Nhiều |

**Substitutions:**

Manchester United:
- 65': Luke Shaw → Ayden Heaven
- 70': Amad → Patrick Dorgu
- 70': Casemiro → Kobbie Mainoo
- 81': Matheus Cunha → Manuel Ugarte
- 82': Benjamin Sesko → Joshua Zirkzee

Brighton:
- 59': Maxim De Cuyper → Tom Watson
- 59': Carlos Baleba → James Milner
- 60': Yasin Ayari → Diego Gomez
- 79': Georginio Rutter → Charalampos Kostoulas
- 87': Mats Wieffer → Stefanos Tzimas

### 🎬 Cách Tạo Video

#### Video đơn giản (10 giây/phút):
```bash
python TimeSeriesRacing.py \
  --data "examples/sports_data/23_man_utd_vs_brighton_match_activity.csv" \
  --output "man_utd_vs_brighton_activity.mp4" \
  --title "Manchester United 4-2 Brighton - Match Activity" \
  --top-n 10 \
  --fps 60 \
  --period-length 200
```

#### Video Ultra HD với custom styling:
```bash
python TimeSeriesRacing.py \
  --data "examples/sports_data/23_man_utd_vs_brighton_match_activity.csv" \
  --output "man_utd_brighton_ultra_hd.mp4" \
  --title "⚽ Manchester United 4-2 Brighton | Live Activity Tracker" \
  --top-n 12 \
  --fps 60 \
  --period-length 300 \
  --dpi 200 \
  --bar-style gradient \
  --theme light \
  --palette "football" \
  --font-family sans-serif
```

#### Video nhanh (highlight 98 phút trong 30 giây):
```bash
python TimeSeriesRacing.py \
  --data "examples/sports_data/23_man_utd_vs_brighton_match_activity.csv" \
  --output "man_utd_brighton_highlights.mp4" \
  --title "Man Utd 4-2 Brighton in 30 Seconds" \
  --top-n 8 \
  --fps 60 \
  --period-length 50 \
  --bar-style modern
```

### 💡 Ý Tưởng Nội Dung Viral

1. **"4-Goal Thriller at Old Trafford"** 🔴
   - Highlight Bryan Mbeumo brace
   - Danny Welbeck free kick masterpiece
   - Late drama với bàn thắng phút 90+

2. **"Bryan Mbeumo: Man of the Match"** ⭐
   - 37 điểm - highest score
   - 2 goals
   - Shot hitting the post

3. **"Goalkeeper Battle: Lammens vs Verbruggen"** 🧤
   - Tracking saves và goals conceded
   - Impact của thủ môn

4. **"The Comeback That Almost Was"** ⚡
   - Brighton fighting back từ 0-3
   - Danny Welbeck wonder goal
   - Kostoulas header

5. **"Old Trafford Goals Fest"** 🎯
   - 6 goals trong 98 phút
   - 4 different goalscorers cho Man Utd
   - Entertainment value cao

### 🎯 Khán Giả Mục Tiêu

- **Premier League fans** - Đặc biệt là fan Man Utd và Brighton
- **Bryan Mbeumo fans** - Star performance với 2 goals
- **Sports analytics enthusiasts** - Data visualization lovers
- **Content creators** - TikTok, Instagram Reels, YouTube Shorts

### 📱 Nền Tảng Phát Hành

- **YouTube**: Full video (1-2 phút) với commentary
- **TikTok/Reels**: 15-30 giây highlights (Bryan Mbeumo brace)
- **Twitter/X**: 60 giây với key goals
- **Facebook**: 1-2 phút full experience

### 🔍 Hashtags Gợi Ý

```
#MUNBHA #ManUtd #Brighton #PremierLeague #BryanMbeumo #OldTrafford
#FootballHighlights #MatchAnalysis #DataViz #SportsAnalytics
#BarChartRace #PremierLeagueGoals #MUFC #BHAFC
```

### 📊 Dữ Liệu Bổ Sung

Dataset này có thể được mở rộng với:
- Possession heatmaps
- Pass completion rates per minute
- Distance covered by players
- Sprint statistics
- xG (Expected Goals) per minute
- Defensive actions timeline

### 🎓 Phân Tích Chuyên Sâu

**Tại sao Bryan Mbeumo có điểm cao nhất?**
- 2 bàn thắng quyết định (phút 61 và 90+6)
- Bàn thắng thứ 3 seal the victory cho Man Utd
- Shot vào cột dọc (phút 71) - unlucky
- Nhiều key passes và create chances
- Consistent performance suốt 98 phút

**Tại sao Brighton thua dù kiểm soát bóng 57%?**
- Hiệu quả dứt điểm kém hơn Man Utd (4 vs 2 goals)
- Defensive blunders (Jan Paul van Hecke phút 34)
- Không tận dụng được possession advantage
- Man Utd clinical với counter-attacks

**MVP của trận đấu?**
- **Bryan Mbeumo** (37 điểm): 2 goals, shots, creativity
- **Danny Welbeck** (27 điểm): Wonder free kick, consistent shots
- **Casemiro** (24 điểm): Goal + assist, defensive solidity

**Turning Points:**
- **Phút 24**: Man Utd mở tỷ số - confidence boost
- **Phút 61**: Bryan Mbeumo 3-0 - game over?
- **Phút 74**: Danny Welbeck free kick - hope for Brighton!
- **Phút 90+2**: Kostoulas 3-2 - comeback on?
- **Phút 90+6**: Bryan Mbeumo 4-2 - sealed!

### 📝 Notes

- **✅ Dataset hoàn chỉnh**: 98 phút liên tục từ 1' đến 98' (không có gap)
- Dataset tracking 15 cầu thủ chính có impact cao nhất từ cả 2 đội
- Điểm số được cập nhật theo từng phút (real-time simulation)
- Các phút không có sự kiện: điểm số giữ nguyên (carry forward)
- Không bao gồm cầu thủ vào sân thay thế muộn (< 10 phút)
- Dữ liệu dựa trên match commentary chi tiết

---

**Nguồn**: Match commentary từ trận Manchester United vs Brighton tại Old Trafford
**Tỷ số chính thức**: Manchester United 4-2 Brighton
**Venue**: Old Trafford
**Weather**: Cold day
**Pitch condition**: Fantastic

🤖 Dataset created for TimeSeriesRacing v3.1 - Editor-Ready Bar Chart Race Videos
