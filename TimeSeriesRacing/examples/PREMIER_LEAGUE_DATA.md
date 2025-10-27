# Dữ liệu Danh hiệu Bóng đá Anh (1990-2024)

## Mô tả

Dữ liệu về **tổng số danh hiệu tích lũy** của các câu lạc bộ bóng đá Anh hàng đầu từ năm 1990 đến 2024.

### Các danh hiệu được tính:

- **Premier League / First Division** (Giải vô địch quốc gia)
- **FA Cup** (Cúp FA)
- **League Cup / Carabao Cup** (Cúp Liên đoàn)
- **Champions League / European Cup** (Cúp C1 châu Âu)
- **Europa League / UEFA Cup** (Cúp C2 châu Âu)

*Lưu ý: Community Shield không được tính trong dữ liệu này*

## Các đội bóng

12 câu lạc bộ hàng đầu của bóng đá Anh:

1. **Manchester United** - "The Red Devils"
2. **Liverpool** - "The Reds"
3. **Chelsea** - "The Blues"
4. **Arsenal** - "The Gunners"
5. **Manchester City** - "The Citizens"
6. **Tottenham Hotspur** - "Spurs"
7. **Leicester City** - "The Foxes"
8. **Blackburn Rovers** - "Rovers"
9. **Newcastle United** - "The Magpies"
10. **Everton** - "The Toffees"
11. **Aston Villa** - "The Villans"
12. **Leeds United** - "The Whites"

## Files dữ liệu

### 1. premier_league_trophies_wide.csv

**Format**: Wide format (nhiều cột)

```csv
year,Manchester United,Liverpool,Chelsea,Arsenal,...
1990,20,38,10,18,...
1992,21,38,10,19,...
```

- **Số dòng**: 35 (1990-2024, mỗi 1-2 năm)
- **Số cột**: 13 (year + 12 đội)
- **Sử dụng**: Tạo video racing với nhiều đội cùng lúc

### 2. premier_league_trophies_long.csv

**Format**: Long format (3 cột)

```csv
year,club,total_trophies
1990,Manchester United,20
1990,Liverpool,38
```

- **Số dòng**: 336 (28 năm × 12 đội)
- **Số cột**: 3 (year, club, total_trophies)
- **Sử dụng**: Dễ xử lý và phân tích

## Điểm nổi bật trong lịch sử

### Thời kỳ thống trị (1990-2024)

#### 1990-2000: Kỷ nguyên Manchester United
- Sir Alex Ferguson thống trị Premier League
- Liverpool vẫn dẫn đầu về tổng số danh hiệu lịch sử
- Blackburn Rovers vô địch Premier League 1995

#### 2000-2010: Cuộc đua tam mã
- Arsenal "The Invincibles" (2003-2004)
- Chelsea bùng nổ với Roman Abramovich (từ 2004)
- Manchester United tiếp tục thống trị
- Liverpool vô địch Champions League 2005

#### 2010-2020: Sự trỗi dậy của Manchester City
- Manchester City thay đổi hoàn toàn (CFG takeover 2008)
- Leicester City kỳ tích vô địch 2016
- Liverpool trở lại đỉnh cao với Klopp (Champions League 2019, Premier League 2020)

#### 2020-2024: Thời đại Guardiola
- Manchester City thống trị tuyệt đối
- Treble lịch sử 2023 (Premier League + FA Cup + Champions League)
- Chelsea, Arsenal cạnh tranh ngôi á quân

## Cách sử dụng với TimeSeriesRacing

### Ví dụ 1: Video cơ bản (Wide format)

```bash
python TimeSeriesRacing.py examples/premier_league_trophies_wide.csv \
  --title "Premier League Trophy Race (1990-2024)" \
  --top 10 \
  --output pl_trophies.mp4
```

### Ví dụ 2: Video TikTok (Long format)

```bash
python TimeSeriesRacing.py examples/premier_league_trophies_long.csv \
  --title "English Football Trophy Race ⚽" \
  --ratio 9:16 \
  --top 8 \
  --output pl_tiktok.mp4
```

### Ví dụ 3: Video với theme tối

```bash
python TimeSeriesRacing.py examples/premier_league_trophies_wide.csv \
  --title "Evolution of English Football Dominance" \
  --theme dark \
  --top 10 \
  --period-length 600 \
  --output pl_dark.mp4
```

### Ví dụ 4: Animation nhanh cho social media

```bash
python TimeSeriesRacing.py examples/premier_league_trophies_long.csv \
  --title "Who Rules English Football?" \
  --top 6 \
  --period-length 300 \
  --steps-per-period 15 \
  --fps 30 \
  --output pl_fast.mp4
```

## Thống kê thú vị

### Top 5 câu lạc bộ nhiều danh hiệu nhất (tính đến 2024):

1. **Liverpool**: 51 danh hiệu
2. **Manchester United**: 56 danh hiệu
3. **Arsenal**: 43 danh hiệu
4. **Manchester City**: 28 danh hiệu (tăng mạnh từ 2011)
5. **Chelsea**: 25 danh hiệu (tăng mạnh từ 2004)

### Tốc độ tăng trưởng nhanh nhất (2010-2024):

1. **Manchester City**: +18 danh hiệu (128% tăng trưởng)
2. **Liverpool**: +7 danh hiệu
3. **Chelsea**: +7 danh hiệu

### Đội có ít thay đổi nhất:

- **Leeds United**, **Blackburn Rovers**: Chỉ thêm 1-2 danh hiệu sau năm 2000

## Tips cho video đẹp

1. **Chọn top 8-10 đội** để không bị quá đông
2. **Period length 500-600ms** để dễ theo dõi
3. **FPS 30** là đủ cho social media
4. **Ratio 9:16** cho TikTok/Reels/Shorts
5. **Theme dark** phù hợp với màu áo của các đội bóng

## Nguồn dữ liệu

Dữ liệu được tổng hợp từ:
- Premier League official records
- UEFA official records
- FA Cup & League Cup historical data
- Club official trophy cabinets

*Lưu ý: Đây là dữ liệu mô phỏng cho mục đích demo. Để có dữ liệu chính xác 100%, vui lòng tham khảo nguồn chính thức.*

## License

Dữ liệu này được tạo cho mục đích giáo dục và demo. Sử dụng tự do.

---

**Created for TimeSeriesRacing Demo**
*Make your data come alive with bar chart racing!*
