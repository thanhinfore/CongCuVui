# Sports Data Collection for TimeSeriesRacing

Bộ sưu tập 20 datasets thể thao chất lượng cao, được thiết kế đặc biệt cho bar chart race videos.

## 📊 Tổng quan

Folder này chứa **20 datasets thể thao** covering các môn thể thao phổ biến nhất thế giới, từ bóng đá, tennis, đến đua xe F1, bóng rổ NBA, golf, boxing và nhiều hơn nữa.

Tất cả dữ liệu đều ở **wide format** (dễ dùng với TimeSeriesRacing) và tracking **cumulative statistics** (số liệu tích lũy) theo thời gian.

---

## 🏆 Danh sách 20 Datasets

### ⚽ Football (Soccer)

#### 1. Champions League Trophies (1956-2024)
**File**: `01_champions_league_trophies.csv`

Tracking cumulative Champions League/European Cup titles cho 20 CLB hàng đầu châu Âu.

**Highlights**:
- Real Madrid: 15 titles (GOAT)
- AC Milan: 7 titles
- Bayern Munich, Liverpool: 6 titles each
- Barcelona: 5 titles

**Usage**:
```bash
python TimeSeriesRacing.py examples/sports_data/01_champions_league_trophies.csv \
  --title "Champions League Trophy Race (1956-2024) 🏆" \
  --palette football \
  --top 10 \
  --output ucl_race.mp4
```

---

### 🏅 Multi-Sport

#### 2. Olympic Medals (1900-2024)
**File**: `02_olympic_medals.csv`

Cumulative gold medals by country across Summer Olympics history.

**Highlights**:
- USA: 1283 gold medals (dominant)
- Soviet Union era: 487 medals
- China's rapid rise from 1984: 0 → 330 medals
- Great Britain: 473 medals

**Usage**:
```bash
python TimeSeriesRacing.py examples/sports_data/02_olympic_medals.csv \
  --title "Olympic Gold Medal Race 🥇" \
  --palette professional \
  --preset youtube \
  --top 12 \
  --output olympics.mp4
```

---

### 🎾 Tennis

#### 3. Grand Slam Tennis Titles (1968-2024)
**File**: `03_grand_slam_tennis.csv`

Cumulative Grand Slam singles titles (Open Era).

**Highlights**:
- Novak Djokovic: 24 titles (record)
- Rafael Nadal: 22 titles
- Roger Federer: 20 titles
- The Big 3 era dominance

**Usage**:
```bash
python TimeSeriesRacing.py examples/sports_data/03_grand_slam_tennis.csv \
  --title "Tennis Grand Slam Race: The Big 3 Era 🎾" \
  --palette vibrant \
  --top 10 \
  --output tennis_goat.mp4
```

#### 11. Wimbledon Singles Titles (1975-2024)
**File**: `11_wimbledon_titles.csv`

Wimbledon singles championships (men's and women's combined).

**Highlights**:
- Martina Navratilova: 9 titles
- Roger Federer: 8 titles
- Novak Djokovic: 7 titles
- Serena Williams, Steffi Graf: 7 titles each

**Usage**:
```bash
python TimeSeriesRacing.py examples/sports_data/11_wimbledon_titles.csv \
  --title "Wimbledon Champions Race 🎾👑" \
  --palette ocean \
  --output wimbledon.mp4
```

---

### ⚽ International Football

#### 4. FIFA World Cup Titles (1930-2022)
**File**: `04_world_cup_titles.csv`

World Cup wins by country.

**Highlights**:
- Brazil: 5 titles (most successful)
- Germany, Italy: 4 titles
- Argentina: 3 titles (2022 winner)
- France: 2 titles

**Usage**:
```bash
python TimeSeriesRacing.py examples/sports_data/04_world_cup_titles.csv \
  --title "FIFA World Cup Glory Race ⚽🌍" \
  --palette football \
  --ratio 9:16 \
  --output worldcup.mp4
```

#### 9. UEFA Euro Championships (1960-2024)
**File**: `09_uefa_euro_titles.csv`

European Championship wins.

**Highlights**:
- Germany, Spain: 3 titles each
- France, Italy: 2 titles
- 10 different winners in history

**Usage**:
```bash
python TimeSeriesRacing.py examples/sports_data/09_uefa_euro_titles.csv \
  --title "UEFA EURO Championship Race 🇪🇺⚽" \
  --palette vibrant \
  --output euro.mp4
```

#### 10. Copa America Titles (1950-2024)
**File**: `10_copa_america_titles.csv`

South American championship wins.

**Highlights**:
- Argentina, Uruguay: 15 titles each (tied)
- Brazil: 9 titles
- Historic rivalry

**Usage**:
```bash
python TimeSeriesRacing.py examples/sports_data/10_copa_america_titles.csv \
  --title "Copa America Glory Race 🏆🇦🇷🇺🇾" \
  --palette sunset \
  --output copa.mp4
```

---

### 🏎️ Motorsports

#### 5. Formula 1 Constructor Championships (1958-2024)
**File**: `05_formula1_championships.csv`

F1 Constructor titles.

**Highlights**:
- Ferrari: 16 titles (most successful)
- Williams: 9 titles
- McLaren, Mercedes: 8 titles
- Red Bull: 6 titles (recent dominance)

**Usage**:
```bash
python TimeSeriesRacing.py examples/sports_data/05_formula1_championships.csv \
  --title "F1 Constructor Championship Race 🏎️💨" \
  --palette neon \
  --bar-style gradient \
  --fps 30 \
  --output f1.mp4
```

---

### 🏀 Basketball

#### 6. NBA Championships (1960-2024)
**File**: `06_nba_championships.csv`

NBA titles by franchise.

**Highlights**:
- Boston Celtics: 18 titles (record)
- Los Angeles Lakers: 17 titles
- Golden State Warriors: 7 titles (4 in recent years)
- Chicago Bulls: 6 titles (Jordan era)

**Usage**:
```bash
python TimeSeriesRacing.py examples/sports_data/06_nba_championships.csv \
  --title "NBA Championship Race 🏀🏆" \
  --palette professional \
  --top 10 \
  --output nba.mp4
```

---

### 🏈 American Football

#### 7. NFL Super Bowl Wins (1970-2024)
**File**: `07_super_bowl_wins.csv`

Super Bowl championships.

**Highlights**:
- New England Patriots: 6 titles
- Pittsburgh Steelers: 6 titles
- Dallas Cowboys, San Francisco 49ers: 5 titles

**Usage**:
```bash
python TimeSeriesRacing.py examples/sports_data/07_super_bowl_wins.csv \
  --title "Super Bowl Championship Race 🏈🏆" \
  --palette football \
  --output superbowl.mp4
```

---

### ⚾ Baseball

#### 8. MLB World Series Wins (1950-2024)
**File**: `08_world_series_wins.csv`

World Series titles.

**Highlights**:
- New York Yankees: 27 titles (dominant)
- St. Louis Cardinals: 11 titles
- Boston Red Sox, Oakland Athletics: 9 titles

**Usage**:
```bash
python TimeSeriesRacing.py examples/sports_data/08_world_series_wins.csv \
  --title "World Series Championship Race ⚾" \
  --palette vibrant \
  --top 12 \
  --output worldseries.mp4
```

---

### 🚴 Cycling

#### 12. Tour de France Wins by Country (1950-2024)
**File**: `12_tour_de_france.csv`

Tour de France wins by rider's country.

**Highlights**:
- France: 36 wins (home advantage)
- Belgium: 18 wins (cycling nation)
- Spain: 12 wins
- Great Britain: 6 wins (recent success)

**Usage**:
```bash
python TimeSeriesRacing.py examples/sports_data/12_tour_de_france.csv \
  --title "Tour de France Glory by Country 🚴🇫🇷" \
  --palette sunset \
  --output tdf.mp4
```

---

### ⛳ Golf

#### 13. Golf Major Championships (1970-2024)
**File**: `13_golf_majors.csv`

Cumulative major wins (Masters, US Open, The Open, PGA).

**Highlights**:
- Jack Nicklaus: 18 majors (all-time record)
- Tiger Woods: 15 majors
- Walter Hagen: 11 majors
- Phil Mickelson: 6 majors

**Usage**:
```bash
python TimeSeriesRacing.py examples/sports_data/13_golf_majors.csv \
  --title "Golf Major Championship Race ⛳🏆" \
  --palette earth \
  --output golf.mp4
```

---

### 🏏 Cricket

#### 14. Cricket World Cup Titles (1975-2023)
**File**: `14_cricket_world_cup.csv`

ODI World Cup wins.

**Highlights**:
- Australia: 5 titles (dominant)
- India, West Indies: 2 titles
- England: 1 title (2019)

**Usage**:
```bash
python TimeSeriesRacing.py examples/sports_data/14_cricket_world_cup.csv \
  --title "Cricket World Cup Glory 🏏" \
  --palette professional \
  --output cricket.mp4
```

---

### 🏉 Rugby

#### 15. Rugby World Cup Wins (1987-2023)
**File**: `15_rugby_world_cup.csv`

Rugby World Cup titles.

**Highlights**:
- South Africa: 4 titles (most successful)
- New Zealand All Blacks: 3 titles
- Australia: 2 titles
- England: 1 title

**Usage**:
```bash
python TimeSeriesRacing.py examples/sports_data/15_rugby_world_cup.csv \
  --title "Rugby World Cup Championship Race 🏉" \
  --palette vibrant \
  --output rugby.mp4
```

---

### 🏒 Ice Hockey

#### 16. NHL Stanley Cup Championships (1960-2024)
**File**: `16_stanley_cup.csv`

Stanley Cup wins.

**Highlights**:
- Montreal Canadiens: 24 titles (record)
- Toronto Maple Leafs: 13 titles
- Detroit Red Wings: 11 titles
- Tampa Bay Lightning: 3 recent titles

**Usage**:
```bash
python TimeSeriesRacing.py examples/sports_data/16_stanley_cup.csv \
  --title "Stanley Cup Championship Race 🏒🏆" \
  --palette ocean \
  --top 12 \
  --output nhl.mp4
```

---

### 🥊 Boxing

#### 17. Boxing World Champions by Country (1960-2024)
**File**: `17_boxing_champions.csv`

Cumulative world champions produced (all weight classes).

**Highlights**:
- USA: 380 champions (dominant)
- Mexico: 185 champions
- United Kingdom: 112 champions
- Philippines: 62 champions

**Usage**:
```bash
python TimeSeriesRacing.py examples/sports_data/17_boxing_champions.csv \
  --title "Boxing World Champions by Country 🥊" \
  --palette neon \
  --top 10 \
  --output boxing.mp4
```

---

### ⚽ Premier League

#### 18. Premier League Top Scorers (1995-2024)
**File**: `18_premier_league_goals.csv`

Cumulative Premier League goals by all-time top scorers.

**Highlights**:
- Alan Shearer: 260 goals (record)
- Harry Kane: 213 goals (active)
- Wayne Rooney: 208 goals
- Mohamed Salah: 164 goals (active)

**Usage**:
```bash
python TimeSeriesRacing.py examples/sports_data/18_premier_league_goals.csv \
  --title "Premier League Top Scorers Race ⚽🔥" \
  --palette football \
  --ratio 9:16 \
  --preset tiktok \
  --output pl_scorers.mp4
```

---

### ⚽ Individual Awards

#### 19. Ballon d'Or Wins by Country (1960-2024)
**File**: `19_ballon_dor.csv`

Cumulative Ballon d'Or awards by player's country.

**Highlights**:
- Argentina: 8 (Messi dominance)
- Germany, Netherlands: 7 each
- Portugal: 5 (Cristiano Ronaldo)
- Brazil: 7 (Ronaldo, Ronaldinho, Kaká)

**Usage**:
```bash
python TimeSeriesRacing.py examples/sports_data/19_ballon_dor.csv \
  --title "Ballon d'Or Glory by Country ⚽👑" \
  --palette sunset \
  --output ballon_dor.mp4
```

---

### 🏊 Swimming

#### 20. Swimming World Records by Country (1960-2024)
**File**: `20_swimming_records.csv`

Cumulative long course world records set.

**Highlights**:
- USA: 635 records (dominant)
- Australia: 195 records
- Germany: 155 records
- China: 85 records

**Usage**:
```bash
python TimeSeriesRacing.py examples/sports_data/20_swimming_records.csv \
  --title "Swimming World Records by Country 🏊💨" \
  --palette ocean \
  --top 10 \
  --output swimming.mp4
```

---

## 🎬 Ví dụ tạo video nhanh

### TikTok/Reels Format (9:16 Portrait)

```bash
# Champions League - Viral format
python TimeSeriesRacing.py examples/sports_data/01_champions_league_trophies.csv \
  --preset tiktok \
  --title "UEFA Champions League Trophy Race 🏆⚽" \
  --top 8 \
  --output ucl_tiktok.mp4

# Tennis Big 3
python TimeSeriesRacing.py examples/sports_data/03_grand_slam_tennis.csv \
  --preset tiktok \
  --title "Tennis GOAT Race: The Big 3 🎾👑" \
  --top 6 \
  --output tennis_tiktok.mp4

# Premier League Goals
python TimeSeriesRacing.py examples/sports_data/18_premier_league_goals.csv \
  --preset tiktok \
  --title "Premier League Goal Kings 👑⚽" \
  --top 8 \
  --output pl_goals_tiktok.mp4
```

### YouTube Format (16:9 Landscape)

```bash
# Olympics - Professional format
python TimeSeriesRacing.py examples/sports_data/02_olympic_medals.csv \
  --preset youtube \
  --title "Olympic Gold Medal Race (1900-2024)" \
  --top 12 \
  --output olympics_yt.mp4

# World Cup
python TimeSeriesRacing.py examples/sports_data/04_world_cup_titles.csv \
  --preset youtube \
  --title "FIFA World Cup Glory: Complete History (1930-2022)" \
  --top 10 \
  --output worldcup_yt.mp4

# F1 Constructors
python TimeSeriesRacing.py examples/sports_data/05_formula1_championships.csv \
  --preset youtube \
  --title "F1 Constructor Championship Race (1958-2024)" \
  --top 10 \
  --output f1_yt.mp4
```

### Instagram Format (9:16 with Pastel)

```bash
# Wimbledon
python TimeSeriesRacing.py examples/sports_data/11_wimbledon_titles.csv \
  --preset instagram \
  --title "Wimbledon Champions 🎾✨" \
  --top 8 \
  --output wimbledon_ig.mp4

# Tour de France
python TimeSeriesRacing.py examples/sports_data/12_tour_de_france.csv \
  --preset instagram \
  --title "Tour de France Glory 🚴💛" \
  --top 8 \
  --output tdf_ig.mp4
```

---

## 💡 Tips cho Sports Videos đẹp

### 1. Chọn Palette phù hợp với môn thể thao

| Sport | Recommended Palette | Lý do |
|-------|-------------------|-------|
| Football/Soccer | `football` | Màu sắc rực rỡ, năng động |
| Tennis | `vibrant` hoặc `professional` | Tươi sáng, chuyên nghiệp |
| Motorsports (F1) | `neon` | Hiện đại, tốc độ |
| Golf | `earth` hoặc `professional` | Trung tính, sang trọng |
| Water sports | `ocean` | Xanh biển tự nhiên |
| Olympics | `professional` | Trang trọng, quốc tế |
| Basketball/American sports | `vibrant` | Màu sắc bắt mắt |

### 2. Chọn số lượng bars phù hợp

- **Top 6-8**: TikTok/Reels (màn hình nhỏ, cần focus)
- **Top 10**: YouTube (màn hình vừa)
- **Top 12-15**: Desktop/TV (màn hình lớn)

### 3. Tốc độ animation

```bash
# Fast (TikTok/Viral)
--period-length 300 --steps-per-period 15

# Medium (YouTube)
--period-length 500 --steps-per-period 12

# Slow (Presentation)
--period-length 800 --steps-per-period 10
```

### 4. Title phù hợp

**TikTok/Viral** - Dùng emoji và hook:
- ✅ "Champions League Trophy Race 🏆⚽🔥"
- ✅ "Tennis GOAT Race: Who's #1? 🎾👑"

**YouTube** - Professional:
- ✅ "FIFA World Cup Glory: Complete History (1930-2022)"
- ✅ "Olympic Gold Medal Race by Country (1900-2024)"

**Instagram** - Aesthetic:
- ✅ "Wimbledon Champions ✨🎾"
- ✅ "Tour de France Glory 🚴💛"

---

## 📈 Thống kê thú vị

### Datasets có drama cao (good for viral):

1. **Grand Slam Tennis** - Big 3 battle, Djokovic vs Nadal vs Federer
2. **Premier League Goals** - Shearer record vs Kane catching up
3. **Ballon d'Or** - Messi vs Ronaldo domination
4. **F1 Constructors** - Ferrari dominance vs Mercedes era vs Red Bull
5. **NBA Championships** - Celtics vs Lakers rivalry

### Datasets có stability cao (good for storytelling):

1. **Olympic Medals** - USA consistent dominance
2. **World Cup** - Brazil historical supremacy
3. **Stanley Cup** - Montreal Canadiens legacy
4. **MLB World Series** - Yankees dynasty

### Datasets có comeback story:

1. **Champions League** - Real Madrid resurgence (2014-2018)
2. **Copa America** - Argentina finally winning (2021, 2024)
3. **Premier League Goals** - Salah, Haaland rapid rise
4. **Rugby World Cup** - South Africa's return

---

## 🔍 Nguồn dữ liệu

Dữ liệu được tổng hợp từ các nguồn chính thức:

- **Football**: UEFA, FIFA, Premier League official records
- **Tennis**: ATP, WTA, Grand Slam official sites
- **Olympics**: IOC official database
- **F1**: Formula 1 official statistics
- **US Sports**: NBA, NFL, MLB, NHL official records
- **Golf**: PGA Tour, major championship records
- **Cricket, Rugby**: ICC, World Rugby official data
- **Boxing**: WBC, WBA, IBF, WBO records
- **Swimming**: FINA world records database

*Lưu ý: Một số dữ liệu được làm tròn hoặc simplified cho mục đích demo. Để có dữ liệu 100% chính xác, vui lòng tham khảo nguồn chính thức.*

---

## 📝 Data Format

Tất cả datasets đều dùng **wide format**:

```csv
year,Entity1,Entity2,Entity3,...
1990,10,5,3,...
1995,15,8,7,...
2000,20,12,10,...
```

- **year**: Năm (hoặc thời điểm)
- **Entities**: Các đội/cầu thủ/quốc gia
- **Values**: Cumulative statistics (số liệu tích lũy)

TimeSeriesRacing sẽ tự động detect format và create racing animation.

---

## 🎯 Next Steps

1. **Explore datasets**: Browse qua 20 files CSV
2. **Test với preset**: Thử `--preset tiktok` hoặc `--preset youtube`
3. **Customize**: Đổi palette, title, top N
4. **Share**: Post lên TikTok/YouTube và tag #TimeSeriesRacing

---

## 📞 Support

Nếu có vấn đề với datasets hoặc cần thêm sports data, tạo issue trên GitHub repo.

---

**Created for TimeSeriesRacing**
*Make your sports data come alive! 🎥⚽🏀🎾*
