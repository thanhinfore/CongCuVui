# 🎓 Knowledge Visualizer v10.0 - CHANGELOG

**Release Date:** 2025-11-02

## 🚀 Major Features

### Knowledge Batch Mode
Chế độ mới chuyên biệt để tạo hàng loạt ảnh tri thức một cách nhanh chóng và dễ dàng!

#### ✨ Key Features:

1. **Mỗi dòng = 1 ảnh**
   - Mỗi dòng văn bản (phân cách bằng Enter) sẽ tự động tạo 1 ảnh riêng biệt
   - Hoàn hảo cho việc tạo series ảnh tri thức, quotes, tips & tricks

2. **Phân biệt rõ ràng giữa Enter và \n**
   - `Enter`: Tạo dòng mới → tạo ảnh mới (trong Knowledge Mode)
   - `\n`: Xuống dòng trong cùng 1 ảnh (soft line break)
   - Linh hoạt tối đa trong việc format nội dung

3. **Smart Preview System**
   - Hiển thị real-time số dòng và số ảnh sẽ được tạo
   - Visual feedback rõ ràng: "X dòng → Y ảnh"
   - Tự động cập nhật khi bạn nhập text

4. **Auto Image Cycling**
   - Nếu có ít ảnh nền hơn số dòng tri thức
   - Hệ thống tự động lặp lại ảnh nền theo chu kỳ
   - Ví dụ: 3 ảnh + 10 dòng → tạo 10 ảnh với 3 background xen kẽ

5. **Knowledge Template**
   - Template mẫu có sẵn để bắt đầu nhanh
   - Hỗ trợ đầy đủ Markdown formatting
   - Button "Insert Template" khi bật Knowledge Mode

## 🎨 UI/UX Improvements

### Visual Enhancements
- **Gradient Card Header**: Header màu tím gradient đẹp mắt cho Knowledge Mode section
- **Toggle Switch**: Checkbox lớn, dễ click để bật/tắt Knowledge Mode
- **Expandable Info**: Thông tin hướng dẫn mở rộng khi bật mode
- **Stats Display**: Hiển thị số liệu trong box màu trắng trong suốt

### User Experience
- **Toast Notifications**: Thông báo khi bật/tắt Knowledge Mode
- **Smart Placeholder**: Placeholder text trong textarea hướng dẫn rõ ràng cách sử dụng
- **Updated Help Modal**: Bổ sung section riêng giải thích Knowledge Mode
- **Template Button**: Chỉ hiển thị khi bật Knowledge Mode

## 🔧 Technical Improvements

### Code Architecture
1. **PreviewPanel.js Updates**
   - Thêm logic xử lý Knowledge Mode trong `render()` method
   - Phân biệt rõ ràng giữa Knowledge Mode và Traditional Mode
   - Tối ưu hóa việc map text lines với images

2. **App.js Enhancements**
   - Thêm `updateKnowledgeStats()` function để tính toán real-time
   - Thêm `insertKnowledgeTemplate()` function
   - Event handlers cho Knowledge Mode checkbox
   - Debounced input tracking cho performance

3. **Smart Text Processing**
   - Maintain existing `\n` handling in wrapStyledText
   - Clear separation between newline characters and `\n` literal
   - Preserve all markdown formatting capabilities

## 📚 Documentation

### Updated Help Content
- Thêm section "Knowledge Mode" trong Help Modal
- Giải thích rõ ràng sự khác biệt giữa Enter và \n
- Ví dụ cụ thể về cách sử dụng
- Best practices cho việc tạo ảnh tri thức

### User Guidance
- Placeholder text hướng dẫn trực tiếp trong textarea
- Inline instructions trong Knowledge Mode card
- Visual preview của output ngay trong UI

## 🎯 Use Cases

Knowledge Mode hoàn hảo cho:

1. **Educational Content**
   - Tạo series flashcards học tập
   - Infographic từng bước
   - Tips & tricks sequences

2. **Social Media**
   - Carousel posts cho Instagram
   - LinkedIn knowledge posts
   - Twitter threads visualization

3. **Business**
   - Company values visualization
   - Team tips và best practices
   - Training materials

4. **Personal Branding**
   - Daily quotes
   - Life lessons series
   - Motivational content

## 🔄 Backward Compatibility

- Tất cả tính năng cũ (v9.1 và trước) vẫn hoạt động bình thường
- Knowledge Mode là opt-in feature (tắt mặc định)
- Không breaking changes cho existing workflows

## 🐛 Bug Fixes

- Đảm bảo `\n` hoạt động nhất quán trong mọi mode
- Fix text wrapping với emoji và markdown
- Cải thiện performance khi xử lý nhiều dòng text

## 🚀 Performance

- Debounced stats calculation (300ms) để tránh lag khi typing
- Optimized render loop cho Knowledge Mode
- Efficient image cycling algorithm

## 📊 Statistics

**Lines of Code Changed:**
- HTML: ~100 lines added
- JavaScript (app.js): ~70 lines added
- JavaScript (previewPanel.js): ~40 lines modified
- Documentation: ~200 lines added

**New Functions:**
- `updateKnowledgeStats()`
- `insertKnowledgeTemplate()`

**New UI Elements:**
- Knowledge Mode toggle section
- Stats preview display
- Template insert button

---

## 🙏 Credits

Developed by: SMCC Team
Version: 10.0
Date: November 2, 2025

**Previous Version:** v9.1 - "Giao Diện Gọn Gàng, Sửa Lỗi Mode Switching"
**Current Version:** v10.0 - "Knowledge Batch Mode"

---

## 📝 Notes for Users

**Để sử dụng Knowledge Mode:**

1. Bật checkbox "🎓 Knowledge Batch Mode" ở đầu Text Content section
2. Nhập mỗi câu tri thức trên 1 dòng riêng (dùng Enter để xuống dòng)
3. Sử dụng `\n` nếu muốn xuống dòng trong cùng 1 ảnh
4. Upload ảnh nền (có thể ít hơn số dòng text)
5. Click "Add Text to Images" để tạo

**Pro Tips:**

- Sử dụng markdown để format text đẹp hơn: `**bold**`, `*italic*`, `==highlight==`
- Click "Insert Template" để xem ví dụ mẫu
- Xem stats preview để biết sẽ tạo được bao nhiêu ảnh
- Combine với Preset Templates để có kết quả nhanh hơn

**Coming Soon (v10.1):**

- Auto font-size adjustment cho text dài
- Bulk export options
- Custom image assignment per line
- Knowledge library presets
