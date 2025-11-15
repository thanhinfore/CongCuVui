# Excel Data Labeler - Gemma 3 270M

## 📋 Hướng dẫn sử dụng

### 1. Cài đặt
1. Tạo thư mục mới cho dự án
2. Lưu 3 file sau vào cùng thư mục:
   - `index.html` - Giao diện HTML
   - `styles.css` - Định dạng CSS
   - `app.js` - Logic JavaScript

### 2. Chạy ứng dụng
- Mở file `index.html` bằng trình duyệt Chrome/Edge
- **Không cần server**, chạy trực tiếp từ file

### 3. Quy trình sử dụng

#### Bước 1: Load AI Model
- Click **"Load Gemma 3 270M"**
- Lần đầu sẽ tải ~240MB (sau đó sẽ cache)
- Đợi cho đến khi hiện **"✅ Ready"**

#### Bước 2: Upload File Excel
- File Excel phải có cột **"Publish Content"**
- Hỗ trợ định dạng `.xlsx` và `.xls`
- Dữ liệu sẽ được hiển thị preview

#### Bước 3: Định nghĩa câu hỏi dán nhãn
Ví dụ các câu hỏi mẫu:

```
What is the sentiment? (positive/negative/neutral)
What is the main topic? (technology/business/health/education/other)
Is this news or opinion? (news/opinion)
What is the urgency level? (high/medium/low)
Does this contain personal information? (yes/no)
```

#### Bước 4: Xử lý dữ liệu
- Click **"Start Labeling"**
- AI sẽ tự động dán nhãn cho từng dòng
- Có thể pause nếu cần

#### Bước 5: Tải kết quả
- Click **"Download Labeled Excel"**
- File mới sẽ chứa các cột nhãn mới: Label_Q1, Label_Q2...

## ⚡ Tối ưu hiệu suất

### Bật WebGPU (tăng tốc 10x)
1. Mở Chrome/Edge
2. Vào `chrome://flags/#enable-webgpu`
3. Chọn **"Enabled"**
4. Restart trình duyệt

## 📊 Cấu trúc file Excel

### Input (bắt buộc):
| Publish Content | Other Columns... |
|-----------------|------------------|
| Text content 1  | Data 1          |
| Text content 2  | Data 2          |

### Output (sau khi xử lý):
| Publish Content | Other Columns... | Label_Q1 | Label_Q2 |
|-----------------|------------------|----------|----------|
| Text content 1  | Data 1          | positive | news     |
| Text content 2  | Data 2          | negative | opinion  |

## 🔧 Tùy chỉnh

### Thay đổi model
Trong file `app.js`, có thể thay đổi model:
```javascript
generator = await pipeline('text-generation',
    'onnx-community/gemma-3-270m-it-ONNX', // Thay model khác ở đây
    {...}
);
```

### Tùy chỉnh prompt
Trong hàm `generateLabel()`:
```javascript
const prompt = `...`; // Tùy chỉnh prompt template
```

## ⚠️ Lưu ý

1. **Yêu cầu trình duyệt**: Chrome/Edge mới nhất
2. **RAM tối thiểu**: 4GB (8GB khuyến nghị)
3. **File Excel lớn**: Nên chia nhỏ thành các batch
4. **Độ chính xác**: Phụ thuộc vào câu hỏi rõ ràng

## 🚀 Tips

1. **Câu hỏi hiệu quả**:
   - Ngắn gọn, rõ ràng
   - Liệt kê các options có thể
   - Tránh câu hỏi mở

2. **Xử lý nhanh hơn**:
   - Dùng WebGPU
   - Giảm max_new_tokens
   - Xử lý theo batch nhỏ

3. **Tiết kiệm thời gian**:
   - Test với vài dòng trước
   - Kiểm tra kết quả mẫu
   - Điều chỉnh câu hỏi nếu cần