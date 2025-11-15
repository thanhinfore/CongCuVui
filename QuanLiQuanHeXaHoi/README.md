# Quản Lý Quan Hệ Xã Hội (Social Relationship Manager)

## Giới Thiệu

Ứng dụng Quản Lý Quan Hệ Xã Hội được thiết kế dựa trên **Số Dunbar** - nghiên cứu cho thấy con người chỉ có thể duy trì tối đa khoảng 150 mối quan hệ có ý nghĩa tại một thời điểm.

Trong thời đại mạng xã hội với hàng nghìn "bạn bè" trên Facebook, chúng ta thường gặp vấn đề:
- Không nhớ nổi tên người vừa gặp tại sự kiện
- Quên mất thông tin quan trọng về người quen
- Không biết khi nào gặp lại họ lần cuối
- Khó quản lý mối quan hệ một cách hiệu quả

Ứng dụng này giúp bạn giải quyết những vấn đề trên!

## Tính Năng Chính

### 1. Dashboard Thống Kê
- Hiển thị tổng quan về tất cả các mối quan hệ
- Thống kê theo 6 vòng tròn Dunbar:
  - **Inner Circle** (5 người): Người thân thiết nhất
  - **Close Friends** (15 người): Bạn thân
  - **Good Friends** (50 người): Bạn bè tốt
  - **Friends** (150 người): Bạn bè
  - **Acquaintances** (500 người): Người quen
  - **Others**: Người khác
- Theo dõi số người gặp trong 30 ngày gần đây
- Cảnh báo khi vượt giới hạn Dunbar

### 2. Quản Lý Danh Bạ
- Thêm/Sửa/Xóa thông tin người quen
- Thông tin chi tiết:
  - Thông tin cơ bản: Tên, email, điện thoại
  - Mức độ quan hệ (vòng tròn Dunbar)
  - Nơi gặp lần đầu, ngày gặp
  - Công ty, chức vụ
  - Liên kết Facebook
  - Tags và ghi chú chi tiết
- Tìm kiếm nhanh theo tên, email, công ty, ghi chú
- Lọc theo mức độ quan hệ
- Sắp xếp theo tên, ngày gặp gần nhất, mức độ quan trọng

### 3. Timeline Gặp Gỡ
- Xem lịch sử các cuộc gặp gỡ
- Sắp xếp theo thời gian
- Hiển thị thời gian gặp (X ngày/tuần/tháng trước)

### 4. Lưu Trữ Dữ Liệu
- Sử dụng LocalStorage của trình duyệt
- Dữ liệu được lưu tự động
- Không cần backend hay database (hiện tại)

## Cách Sử Dụng

### Khởi Chạy Ứng Dụng

#### Cách 1: Mở trực tiếp file HTML
```bash
# Chỉ cần mở file index.html bằng trình duyệt
cd QuanLiQuanHeXaHoi
# Double-click vào index.html hoặc mở bằng trình duyệt
```

#### Cách 2: Sử dụng web server đơn giản
```bash
# Python 3
cd QuanLiQuanHeXaHoi
python -m http.server 8000

# Sau đó mở trình duyệt tại: http://localhost:8000
```

#### Cách 3: Chạy với IIS Express (Visual Studio)
- Mở solution CongCuVui.sln
- Set QuanLiQuanHeXaHoi làm Startup Project
- Nhấn F5 để chạy

### Hướng Dẫn Sử Dụng Chi Tiết

#### 1. Thêm Người Mới
1. Nhấn nút **"Thêm Người"** ở tab Danh Bạ
2. Điền thông tin (tối thiểu: Tên và Mức độ quan hệ)
3. Chọn vòng tròn Dunbar phù hợp:
   - **Inner Circle**: Gia đình, người yêu, bạn thân nhất
   - **Close Friends**: Bạn thân gặp thường xuyên
   - **Good Friends**: Bạn bè tốt
   - **Friends**: Bạn bè thông thường
   - **Acquaintances**: Người quen
   - **Others**: Người khác
4. Nhấn **"Lưu"**

**Lưu ý**: Ứng dụng sẽ cảnh báo nếu bạn vượt quá giới hạn của từng vòng tròn!

#### 2. Xem Chi Tiết
- Click vào bất kỳ liên hệ nào trong danh sách để xem thông tin chi tiết
- Có thể chỉnh sửa hoặc xóa từ màn hình chi tiết

#### 3. Tìm Kiếm và Lọc
- **Tìm kiếm**: Gõ từ khóa vào ô tìm kiếm (tìm theo tên, email, công ty, ghi chú, tags)
- **Lọc theo nhóm**: Chọn vòng tròn Dunbar trong dropdown
- **Sắp xếp**:
  - Tên (A-Z)
  - Gặp gần đây
  - Mức độ quan trọng

#### 4. Dashboard
- Xem tổng quan thống kê
- Click vào các vòng tròn Dunbar để xem danh sách người trong nhóm đó
- Theo dõi số người gặp trong 30 ngày gần đây

#### 5. Timeline
- Xem lịch sử các cuộc gặp gỡ theo thời gian
- Giúp bạn nhớ lại khi nào gặp ai

## Cấu Trúc Dự Án

```
QuanLiQuanHeXaHoi/
├── index.html          # Giao diện chính
├── styles.css          # Thiết kế và styling
├── app.js              # Logic ứng dụng (JavaScript)
├── README.md           # Tài liệu hướng dẫn
├── Web.config          # Cấu hình ASP.NET
└── QuanLiQuanHeXaHoi.csproj  # Project file
```

## Công Nghệ Sử Dụng

### Front-end
- **HTML5**: Cấu trúc trang web
- **CSS3**: Thiết kế responsive, hiện đại
  - CSS Grid & Flexbox
  - CSS Variables
  - Animations & Transitions
  - Gradient backgrounds
- **Vanilla JavaScript (ES6+)**: Logic ứng dụng
  - Class-based architecture
  - LocalStorage API
  - Event handling
  - DOM manipulation

### Thư Viện Bên Ngoài
- **Google Fonts**: Font chữ Inter
- **Font Awesome 6**: Icons

### Back-end (Sẽ phát triển sau)
- ASP.NET Framework 4.6.1
- SQL Server / Entity Framework
- Web API

## Lưu Ý Quan Trọng

### Về Dữ Liệu
- Dữ liệu hiện tại được lưu trong **LocalStorage** của trình duyệt
- Dữ liệu chỉ tồn tại trên máy tính/trình duyệt bạn đang sử dụng
- **KHÔNG** xóa cache/dữ liệu trình duyệt nếu không muốn mất dữ liệu
- Nên export dữ liệu định kỳ (tính năng sẽ được thêm)

### Giới Hạn
- LocalStorage có giới hạn ~5-10MB tùy trình duyệt
- Không đồng bộ giữa các thiết bị
- Không có tính năng đăng nhập/bảo mật

### Tương Lai
Các tính năng sẽ được phát triển:
- Backend API với ASP.NET
- Database để lưu trữ dài hạn
- Đăng nhập/Đăng ký
- Đồng bộ đa thiết bị
- Import từ Facebook, LinkedIn
- Export/Import dữ liệu
- Nhắc nhở tự động (gặp lại người quan trọng)
- Phân tích insights
- Ứng dụng mobile

## Số Dunbar - Nghiên Cứu Khoa Học

**Số Dunbar** là một giới hạn về khả năng nhận thức được đề xuất bởi nhà nhân loại học người Anh Robin Dunbar. Số này đại diện cho số lượng mối quan hệ xã hội ổn định tối đa mà một người có thể duy trì.

### Các Vòng Tròn Dunbar:
1. **5 người**: Người thân thiết nhất (support clique)
2. **15 người**: Bạn thân (sympathy group)
3. **50 người**: Bạn bè tốt (band)
4. **150 người**: Bạn bè có ý nghĩa (tribe) - **Giới hạn Dunbar**
5. **500 người**: Người quen (megaband)
6. **1500 người**: Người nhận diện được mặt (tribal grouping)

Ứng dụng này giúp bạn quản lý và duy trì các mối quan hệ một cách có ý thức và hiệu quả!

## Tác Giả

**Thành** - 2024

## License

Dự án mã nguồn mở - Tự do sử dụng và phát triển

---

**Enjoy managing your relationships! 👥💙**
