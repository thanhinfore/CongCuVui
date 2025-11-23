# 🚀 Quản Lý Quan Hệ Xã Hội - ENHANCED VERSION

Hệ thống quản lý quan hệ xã hội thông minh dựa trên lý thuyết **Dunbar's Number** với các tính năng AI, Analytics, và nhiều công cụ nâng cao giúp bạn duy trì và phát triển mạng lưới quan hệ một cách hiệu quả.

## ✨ Tính Năng Mới trong Phiên Bản Enhanced

### 🎯 1. Relationship Health Score
- **Đánh giá tự động** sức khỏe của mỗi mối quan hệ dựa trên:
  - ⏰ Thời gian từ lần gặp cuối cùng
  - 📊 Độ đầy đủ thông tin liên hệ
  - 💎 Mức độ quan trọng của quan hệ
- **4 mức đánh giá**:
  - 🟢 **Tuyệt vời** (80-100): Quan hệ rất khỏe mạnh
  - 🔵 **Tốt** (60-79): Quan hệ ổn định
  - 🟡 **Trung bình** (40-59): Cần chú ý thêm
  - 🔴 **Cần chú ý** (<40): Nên liên lạc sớm
- Hiển thị **badge trực quan** trên mỗi contact và timeline

### 🔔 2. Smart Reminders (Nhắc Nhở Thông Minh)
- Tự động phát hiện những người lâu không gặp
- Gợi ý liên lạc dựa trên mức độ quan hệ:
  - Inner Circle: nhắc sau 7 ngày
  - Close Friends: nhắc sau 14 ngày
  - Good Friends: nhắc sau 30 ngày
  - Friends: nhắc sau 90 ngày
  - Acquaintances: nhắc sau 180 ngày
- Notification popup đẹp mắt, dễ tương tác
- Kiểm tra tự động mỗi giờ

### 📊 3. Advanced Analytics Dashboard
Powered by **Chart.js** với 4 loại biểu đồ:

#### 📈 Dunbar Circle Distribution (Doughnut Chart)
- Phân bố số người trong mỗi vòng tròn Dunbar
- Màu sắc riêng biệt cho từng nhóm
- Tương tác trực quan

#### 📊 Health Score Distribution (Bar Chart)
- Thống kê số người theo mức Health Score
- Dễ dàng nhận biết tổng thể mạng lưới

#### 📉 Activity Timeline (Line Chart)
- Hoạt động gặp gỡ trong 30 ngày qua
- Theo dõi xu hướng tương tác

#### 🏆 Top Contacts by Health Score (Horizontal Bar)
- Top 10 người có Health Score cao nhất
- Màu sắc theo mức đánh giá

### 🌙 4. Dark Mode & Theme Customization
- **Toggle dễ dàng** giữa Light/Dark mode
- Tự động lưu preference vào LocalStorage
- Design tối ưu cho cả 2 chế độ
- Bảo vệ mắt khi sử dụng ban đêm
- **Shortcut**: `Ctrl+D` hoặc `Cmd+D`

### ⚡ 5. Quick Actions & Keyboard Shortcuts
Quick Actions menu với các tác vụ thường dùng:
- ➕ Thêm người mới
- 📥 Import CSV
- 📤 Export CSV/vCard/JSON
- 🌙 Toggle Dark Mode
- 🔔 Xem nhắc nhở

**Keyboard Shortcuts**:
- `Ctrl+K` / `Cmd+K`: Quick Search (focus vào ô tìm kiếm)
- `Ctrl+N` / `Cmd+N`: Thêm người mới
- `Ctrl+D` / `Cmd+D`: Toggle Dark Mode
- `Ctrl+E` / `Cmd+E`: Export CSV
- `Ctrl+1/2/3`: Switch giữa các tabs
- `Esc`: Đóng modal

### 📤 6. Import/Export Nâng Cao

#### Export Options:
1. **CSV Format**
   - Export toàn bộ hoặc chỉ những người đã chọn
   - Tương thích với Excel, Google Sheets
   - UTF-8 encoding (hỗ trợ tiếng Việt)

2. **vCard Format (.vcf)**
   - Import trực tiếp vào điện thoại
   - Tương thích với iOS, Android
   - Hỗ trợ nhiều contacts trong 1 file

3. **JSON Format**
   - Backup đầy đủ dữ liệu
   - Dễ dàng restore sau này

#### Import Options:
- **Import từ CSV**: Tự động parse và validate
- Hỗ trợ bulk import hàng trăm contacts
- Progress indicator trong quá trình import

### ✅ 7. Bulk Operations (Thao Tác Hàng Loạt)
- **Chọn nhiều contacts** cùng lúc với checkbox
- **Bulk Actions Bar** hiện khi có selection:
  - 🗑️ Xóa hàng loạt
  - 🔄 Đổi nhóm hàng loạt
  - 📤 Export selected
- **Select All / Deselect All**: Nút nhanh
- Highlight contacts đã chọn với border màu

### 🕐 8. Enhanced Timeline với Visualization
- Timeline với **Health Score badge**
- Click để xem chi tiết contact
- Màu sắc tùy theo Health Score
- Sắp xếp theo thời gian mới nhất

### 🎨 9. UI/UX Improvements
- **Smooth Animations**:
  - Fade in / Scale
  - Slide up / Bounce in
  - Smooth transitions
- **Enhanced Scrollbar** với gradient
- **Loading states** và skeleton screens
- **Tooltips** khi hover
- **Accessibility** improvements:
  - Keyboard navigation
  - Focus visible
  - Screen reader support
  - High contrast mode support
  - Reduced motion support

### 🖨️ 10. Print-Friendly Design
- Tự động ẩn buttons và nav khi in
- Layout tối ưu cho giấy A4
- Page break optimization

## 🚀 Cách Sử Dụng

### Yêu Cầu
- Backend API đang chạy (ASP.NET Web API)
- Browser hiện đại (Chrome, Firefox, Safari, Edge)
- JavaScript enabled

### Cài Đặt & Chạy

#### Phương án 1: Sử dụng file Enhanced
1. Mở file `index-enhanced.html` trong browser
2. Đảm bảo backend API đang chạy
3. Login với tài khoản của bạn

#### Phương án 2: Thay thế file gốc
```bash
# Backup file gốc
cp index.html index-original.html
cp app-api.js app-api-original.js
cp styles.css styles-original.css

# Sử dụng file enhanced
cp index-enhanced.html index.html
cp app-enhanced.js app-api.js
# Thêm link đến styles-enhanced.css trong index.html
```

### Hướng Dẫn Sử Dụng Chi Tiết

#### 1️⃣ Thêm Contact với Health Score
- Click nút "Thêm Người" hoặc `Ctrl+N`
- Điền đầy đủ thông tin để Health Score cao hơn
- Đặc biệt chú ý: **Gặp lần cuối** để tính Health Score chính xác

#### 2️⃣ Xem Health Score & Reminders
- Health Score hiển thị bên cạnh mỗi contact
- Màu sắc thay đổi theo mức độ: 🟢🔵🟡🔴
- Click contact để xem chi tiết Health Score với tips cải thiện

#### 3️⃣ Sử dụng Smart Reminders
- Notification tự động hiện ở góc dưới bên phải
- Click vào reminder để xem chi tiết contact
- Click X để đóng notification

#### 4️⃣ Xem Analytics Dashboard
- Vào tab "Dashboard"
- Scroll xuống để xem 4 biểu đồ analytics
- Biểu đồ tự động cập nhật khi có thay đổi

#### 5️⃣ Bulk Operations
- Tick checkbox để chọn nhiều contacts
- Bulk Actions Bar sẽ hiện ở bottom
- Chọn action: Delete, Change Level, Export
- Click "Bỏ chọn" để clear selection

#### 6️⃣ Import/Export Dữ Liệu
- Click icon "Quick Actions" (⚡) trên nav bar
- Chọn action muốn thực hiện
- Với Export: chọn contacts trước (optional)
- Với Import: chọn file CSV từ máy

#### 7️⃣ Keyboard Shortcuts
- `Ctrl+K`: Focus vào search box
- `Ctrl+N`: Modal thêm người mới
- `Ctrl+D`: Toggle Dark/Light mode
- `Ctrl+E`: Quick export CSV
- `Ctrl+1/2/3`: Switch tabs
- `Esc`: Đóng modal/popup

## 🎨 Customization

### Thay Đổi Colors
Edit file `styles-enhanced.css`:
```css
:root {
    --primary-color: #667eea;  /* Màu chính */
    --secondary-color: #764ba2; /* Màu phụ */
    --success-color: #43e97b;   /* Màu xanh lá */
    --warning-color: #fee140;   /* Màu vàng */
    --danger-color: #f5576c;    /* Màu đỏ */
}
```

### Thay Đổi Health Score Thresholds
Edit file `app-enhanced.js`:
```javascript
const levelThresholds = {
    inner: 7,        // Inner circle: gặp mỗi 7 ngày
    close: 14,       // Close: mỗi 2 tuần
    good: 30,        // Good: mỗi tháng
    friends: 90,     // Friends: mỗi 3 tháng
    acquaintances: 180  // Acquaintances: mỗi 6 tháng
};
```

## 📱 Responsive Design
- ✅ Desktop (1200px+): Full features
- ✅ Tablet (768px - 1199px): Optimized layout
- ✅ Mobile (< 768px): Touch-friendly, stacked layout

## 🔧 Troubleshooting

### Chart.js không hiển thị
- Đảm bảo có kết nối internet (Chart.js load từ CDN)
- Kiểm tra Console cho errors
- Refresh page

### Dark Mode không lưu
- Kiểm tra LocalStorage không bị block
- Clear cache và thử lại

### Health Score không chính xác
- Đảm bảo "Gặp lần cuối" được điền đúng
- Điền đầy đủ thông tin để tăng điểm

### Import CSV lỗi
- File CSV phải có đúng format
- Encoding phải là UTF-8
- Kiểm tra headers: Name,Email,Phone,Level,...

## 🎯 Best Practices

1. **Cập nhật "Gặp lần cuối" thường xuyên** để Health Score chính xác
2. **Điền đầy đủ thông tin** (email, phone, company, position) để tăng điểm
3. **Sử dụng Tags** để dễ tìm kiếm và phân loại
4. **Export backup định kỳ** (khuyến nghị mỗi tháng)
5. **Check reminders thường xuyên** để duy trì quan hệ
6. **Review Analytics** hàng tuần để điều chỉnh strategy

## 📊 Health Score Breakdown

### Công Thức Tính
```
Health Score = Recency Score (40%)
             + Information Completeness (30%)
             + Relationship Depth (30%)
```

### Cải Thiện Health Score
- ✅ Gặp gỡ thường xuyên (tăng Recency)
- ✅ Điền đầy đủ thông tin (tăng Completeness)
- ✅ Nâng cấp level quan hệ (tăng Depth)

## 🔐 Privacy & Security
- ✅ Dữ liệu lưu trên server riêng
- ✅ Không chia sẻ với bên thứ 3
- ✅ Export dữ liệu bất cứ lúc nào
- ✅ Xóa account xóa toàn bộ dữ liệu

## 🚀 Performance
- Lazy loading cho charts
- Debounced search
- Optimized rendering
- Minimal bundle size
- Fast load time (<2s)

## 🆕 Upcoming Features (Roadmap)
- [ ] Birthday & Anniversary Reminders
- [ ] Email/SMS integration
- [ ] Mobile app (React Native)
- [ ] Team collaboration
- [ ] AI-powered relationship suggestions
- [ ] Calendar integration
- [ ] Meeting notes & history
- [ ] Relationship goals & tracking

## 📄 License
MIT License - Free to use for personal and commercial projects

## 👨‍💻 Author
**Thành & Claude AI**
- Enhanced Version: 2025

## 🙏 Acknowledgments
- Dunbar's Number theory
- Chart.js library
- Font Awesome icons
- Google Fonts (Inter)

---

## 🎉 Enjoy Your Enhanced Social Relationship Manager!

Nếu có câu hỏi hoặc feedback, hãy tạo issue trên GitHub hoặc liên hệ trực tiếp.

**Happy Networking! 🤝**
