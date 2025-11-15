# ClassSurvey 📊

Ứng dụng phân tích và biểu diễn kết quả khảo sát lớp học từ Google Sheets.

## Tính năng

✨ **Đọc dữ liệu từ Google Sheets**
- Hỗ trợ CSV export từ Google Forms
- Tự động phân tích cấu trúc dữ liệu
- Validation URL và error handling

📊 **Phân tích và Visualization**
- 6 loại biểu đồ: Bar, Horizontal Bar, Pie, Doughnut, Line, Radar
- 6 bảng màu khác nhau: Vibrant, Pastel, Professional, Ocean, Sunset, Neon
- Thống kê chi tiết cho mỗi câu hỏi
- Tự động nhận diện loại câu hỏi

💾 **Export và Chia sẻ**
- Export JSON
- Export CSV
- In kết quả
- Lưu lịch sử phiên làm việc

🎨 **Giao diện Modern**
- Responsive design
- Accessibility support (ARIA labels)
- Toast notifications
- Loading states

## Cách sử dụng

### 1. Chuẩn bị dữ liệu Google Sheets

1. Tạo Google Form với các câu hỏi khảo sát
2. Thu thập responses từ học viên
3. Mở **Responses** tab → Click **View in Sheets**
4. Trong Google Sheets:
   - **File** → **Share** → **Publish to web**
   - Chọn **Entire Document** và **CSV**
   - Click **Publish**
   - Copy link CSV

### 2. Sử dụng ClassSurvey

1. Mở `index.html` trong trình duyệt
2. Dán link CSV vào form
3. (Tùy chọn) Đặt tên cho khảo sát
4. Click **"Kiểm tra kết nối"** để test
5. Click **"Bắt đầu phân tích"**

### 3. Phân tích kết quả

- Chọn câu hỏi từ sidebar bên trái
- Thay đổi loại biểu đồ và bảng màu
- Xem thống kê chi tiết trong bảng
- Export kết quả nếu cần

## Cấu trúc dự án

```
ClassSurvey/
├── index.html              # Giao diện chính
├── css/
│   └── main.css           # Stylesheet
├── js/
│   ├── googleSheetsHandler.js  # Xử lý Google Sheets API
│   ├── surveyManager.js        # Quản lý và phân tích dữ liệu
│   ├── chartRenderer.js        # Render biểu đồ với Chart.js
│   └── app.js                  # Logic chính
└── README.md
```

## Công nghệ sử dụng

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charting**: Chart.js 3.9.1
- **CSV Parsing**: PapaParse 5.3.0
- **Backend**: ASP.NET Framework 4.6.1

## Các loại câu hỏi được hỗ trợ

✅ Multiple choice (một lựa chọn)
✅ Checkboxes (nhiều lựa chọn)
✅ Short answer (văn bản ngắn)
✅ Linear scale (thang điểm)
✅ Dropdown (danh sách)

## Định dạng dữ liệu CSV

ClassSurvey mong đợi định dạng CSV từ Google Forms:

```
Timestamp, Email (optional), Question 1, Question 2, ...
2024-01-15 10:30:00, user@example.com, Answer 1, Answer 2, ...
```

- **Cột 1**: Timestamp (bắt buộc)
- **Cột 2**: Email/Username (tùy chọn, sẽ được tự động bỏ qua)
- **Cột 3+**: Các câu hỏi và câu trả lời

## Lưu ý

- Đảm bảo Google Sheets đã được publish to web dưới dạng CSV
- Link CSV phải public và accessible
- Dữ liệu sẽ được cache trong browser để tăng tốc độ
- Sử dụng "Refresh" để cập nhật dữ liệu mới nhất

## Tác giả

Phát triển bởi CongCuVui Team

## License

MIT License
