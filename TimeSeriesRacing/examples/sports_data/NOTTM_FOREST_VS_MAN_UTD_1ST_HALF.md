# Nottingham Forest vs Manchester United - First Half Analysis

## 📊 Dataset: `25_nottm_forest_vs_man_utd_1st_half.csv`

Phân tích chi tiết hoạt động của cầu thủ trong **HIỆP 1** trận **Nottingham Forest vs Manchester United**.

### ✨ Dataset Features

- **📅 Đầy đủ 47 phút hiệp 1**: Dữ liệu cho TỪNG phút từ 1' đến 45+4' (45' + 4' injury time)
- **👥 21 cầu thủ**: Tracking các cầu thủ có impact cao nhất từ cả 2 đội
- **📈 Cumulative scoring**: Điểm số tích lũy theo thời gian thực
- **🎯 Ultra-smooth animation**: Mượt mà hoàn toàn, không có hiện tượng "nhảy"

### 🎯 Điểm Nổi Bật Hiệp 1

- **Tỷ số hiệp 1**: Nottingham Forest 0-1 Manchester United
- **Thời lượng**: 47 phút (45 phút + 4 phút injury time)
- **Tỷ lệ kiểm soát bóng**: Nottingham Forest 44%, Manchester United 56%
- **Bàn thắng**: Casemiro (Manchester United) - phút 34'
- **Chấn thương**: Douglas Luiz (Nottingham Forest) thay bằng Ryan Yates ở phút 14'

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
| ⚡ **Defensive action** | +1 |
| 🚫 **Clearance/Interception** | +1 |

### 🌟 Top Performers Hiệp 1 (Điểm tích lũy cuối hiệp)

#### Manchester United:
1. **Casemiro**: 14 điểm
   - ⚽ 1 bàn thắng (phút 34') - Header từ corner của Bruno Fernandes
   - 🛡️ Nhiều tackles và interceptions
   - 🔑 Winning possession trong midfield

2. **Bruno Fernandes**: 9 điểm
   - 🎯 1 kiến tạo (phút 34') - Corner cho Casemiro
   - 🛡️ Tackles và winning possession
   - 🔑 Swings in corners và crosses

3. **Diogo Dalot**: 3 điểm
   - 🚫 Interceptions
   - 🛡️ Defensive contributions

#### Nottingham Forest:
1. **Elliot Anderson**: 7 điểm
   - 🎲 Shots from outside the box
   - 🛡️ Tackles và winning possession
   - ⚡ High energy in midfield

2. **Callum Hudson-Odoi**: 6 điểm
   - 🎲 Shots from outside the box
   - 🔑 Creating scoring opportunities
   - 🛡️ Active involvement in attacks

3. **Matz Sels**: 6 điểm (Goalkeeper)
   - 🧤 Multiple saves
   - ⚡ Control the box and intercept crosses

### 📊 Key Statistics

#### Manchester United:
- **Possession**: 56%
- **Shots**: Multiple attempts from Amad, Bryan Mbeumo, Benjamin Sesko
- **Corners**: Several corners from Bryan Mbeumo
- **Key moment**: Casemiro header goal at 34'

#### Nottingham Forest:
- **Possession**: 44%
- **Shots**: Callum Hudson-Odoi, Dan Ndoye, Elliot Anderson all had shots
- **Chances**: Morgan Gibbs-White blocked shot
- **Issue**: Douglas Luiz injury forced early substitution

### 🔥 Match Highlights

**Key Moments:**
- **1'**: Manchester United kick-off
- **7'**: Dan Ndoye corner and Igor Jesus blocked shot for Nottingham Forest
- **12-14'**: Douglas Luiz injured, replaced by Ryan Yates
- **16'**: Benjamin Sesko fails to find target with shot
- **34'**: ⚽ **GOAL!** Casemiro heads home from Bruno Fernandes corner (0-1)
- **40'**: Callum Hudson-Odoi shot from outside box misses
- **42'**: Amad shot from outside box misses, Morgan Gibbs-White shot blocked
- **44'**: Morgan Gibbs-White shot blocked by Luke Shaw
- **45'**: Dan Ndoye and Igor Jesus ruled offside
- **45+4'**: Half-time whistle

### 📝 Notable Events

**Offside Calls:**
- Igor Jesus (45')
- Dan Ndoye (43')
- Amad (29')

**Blocked Shots:**
- Morgan Gibbs-White shot blocked by Luke Shaw (44')
- Igor Jesus shot blocked (7')
- Benjamin Sesko shot blocked (3', 16')

**Goalkeeper Saves:**
- Matz Sels saves Amad shot (29')
- Senne Lammens saves Dan Ndoye shot (8')

### 🎮 Usage in Bar Chart Race

This dataset is perfect for visualizing:
- Real-time player contribution as the match progresses
- The build-up to Casemiro's goal at minute 34
- Impact of Ryan Yates substitution for Douglas Luiz
- Comparative performance between both teams' players

### 💡 Insights

1. **Manchester United's Control**: With 56% possession, Manchester United controlled the first half
2. **Clinical Finish**: Despite similar activity levels, Manchester United converted through Casemiro's header
3. **Forest's Chances**: Nottingham Forest created opportunities but couldn't convert
4. **Midfield Battle**: High activity from both teams' midfielders (Casemiro, Bruno Fernandes vs Elliot Anderson, Morgan Gibbs-White)
5. **Defensive Solidity**: Both teams showed good defensive organization with multiple blocks and clearances

### 🎨 Suggested Visualization Colors

**Manchester United** (Home):
- Primary: Red (#DA291C)
- Secondary: Yellow (#FBE122)

**Nottingham Forest** (Away):
- Primary: Red (#DD0000)
- Secondary: White (#FFFFFF)

---

*Data extracted from official match commentary and statistics*
