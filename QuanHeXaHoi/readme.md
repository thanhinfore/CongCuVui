Đây là nội dung cập nhật cho file `README.md`. Tôi đã lồng ghép các yêu cầu của bạn vào và bổ sung thêm các tính năng quan trọng để chương trình trở nên **thân thiện với người dùng phổ thông** (không rành công nghệ) và **dễ dàng lan tỏa**.

Bạn hãy thay thế hoặc cập nhật nội dung file `README.md` hiện tại bằng nội dung dưới đây:

-----

# Social Graph 6 Layers - Sơ Đồ Quan Hệ Xã Hội

> **Slogan:** "Hình dung thế giới của bạn trong 6 vòng tròn."

Dự án mã nguồn mở giúp bất kỳ ai cũng có thể tự vẽ và quản lý mạng lưới quan hệ xã hội của mình. Chương trình chạy hoàn toàn trên trình duyệt, đảm bảo quyền riêng tư và dễ dàng chia sẻ.

-----

## 1\. Tầm Nhìn & Mục Tiêu (Vision)

Mục tiêu của dự án là **phổ cập công cụ quản lý mối quan hệ** cho đại chúng:

  * **Đơn giản:** Không cần cài đặt, không cần đăng ký tài khoản. Mở lên là dùng.
  * **Riêng tư:** Dữ liệu nằm hoàn toàn trên máy người dùng, không gửi về máy chủ.
  * **Hữu ích:** Giúp người dùng nhìn thấy bức tranh tổng quan về gia đình, bạn bè, đối tác để phân bổ thời gian chăm sóc mối quan hệ hợp lý.

-----

## 2\. Tính Năng Chính (Key Features)

### 2.1. Quản lý Mối Quan Hệ Trực Quan

  * **Mô hình 6 Lớp (Dunbar's Layers):** Tự động sắp xếp người thân, bạn bè vào các vòng tròn dựa trên độ thân thiết.
  * **Thao tác Chạm & Click:** Thêm, sửa, xóa người, nối dây quan hệ chỉ bằng thao tác đơn giản.
  * **Phân loại đa dạng:** Hỗ trợ định nghĩa các mối quan hệ phức tạp (Vợ chồng, Cha con, Đồng nghiệp, Đối tác...).

### 2.2. Lưu Trữ & Bảo Mật (Storage & Privacy) 🆕

  * **Tự động lưu (Auto-save):** Dữ liệu được lưu ngay lập tức vào bộ nhớ trình duyệt (`localStorage`). Người dùng có thể tắt tab, F5 và mở lại mà không mất dữ liệu.
  * **100% Offline:** Chương trình không yêu cầu internet sau khi tải xong, đảm bảo dữ liệu cá nhân nhạy cảm không bị lộ lọt ra ngoài.

### 2.3. Chia Sẻ & Sao Lưu (Share & Export) 🆕

  * **Xuất file lưu trữ (.json):** Cho phép xuất toàn bộ dữ liệu hoặc **một nhóm node đã chọn** ra file để gửi cho người khác (hoặc để backup sang máy khác).
  * **Chụp ảnh đồ thị (.png):** Nút "Chụp ảnh" giúp xuất ra hình ảnh độ nét cao để chia sẻ lên mạng xã hội hoặc chèn vào slide thuyết trình.

-----

## 3\. Lộ Trình Phát Triển (Roadmap)

Để chương trình ai cũng dùng được, chúng ta sẽ phát triển theo các giai đoạn sau:

### Phase 1: Trải nghiệm người dùng cơ bản (Core UX)

  - [x] Giao diện thêm/sửa/xóa Node.
  - [x] Logic vẽ vòng tròn tự động.
  - [ ] **Lưu trữ cục bộ (Local Storage):** Đảm bảo không mất dữ liệu khi tải lại trang.
  - [ ] **Export/Import dữ liệu:** Tính năng xuất file JSON để người dùng backup.

### Phase 2: Cá nhân hóa & Chia sẻ (Personalization)

  - [ ] **Avatar hình ảnh:** Cho phép dán link ảnh đại diện thay vì chỉ hiện chấm tròn màu.
  - [ ] **Bộ lọc thông minh:** Ví dụ: "Chỉ hiện nhánh gia đình bên nội", "Chỉ hiện bạn bè cấp 3".
  - [ ] **Xuất ảnh chất lượng cao:** Tạo nút Download ảnh PNG trong suốt (transparent background).

### Phase 3: Mở rộng cho đại chúng (Mass Adoption)

Những tính năng này nhằm giúp người không rành công nghệ cũng dùng được:

  - [ ] **Hỗ trợ Mobile (Responsive):** Tối ưu hóa thao tác chạm/vuốt trên điện thoại (vì đa số mọi người dùng smartphone).
  - [ ] **Mẫu có sẵn (Templates):**
      - Mẫu "Gia phả dòng họ".
      - Mẫu "Sơ đồ công ty".
      - Mẫu "Mạng lưới quan hệ kinh doanh (BNI)".
  - [ ] **Hướng dẫn tương tác (Interactive Tutorial):** Khi người mới vào lần đầu, sẽ có hướng dẫn từng bước (Step-by-step tour) chỉ cách tạo node đầu tiên.
  - [ ] **Đa ngôn ngữ:** Hỗ trợ Tiếng Việt & Tiếng Anh.

-----

## 4\. Kiến Trúc Kỹ Thuật (Architecture)

Chương trình được thiết kế theo hướng **Client-side only** (Chỉ chạy phía máy khách) để tối ưu chi phí vận hành và bảo mật.

```text
Structure:
├── index.html          # Giao diện chính
├── css/                # Giao diện (Responsive, Mobile-first)
├── js/
│   ├── core/           # Logic đồ thị (Graphology)
│   ├── storage.js      # Module xử lý LocalStorage & Export/Import
│   ├── renderer.js     # Module vẽ (Sigma.js)
│   └── ui.js           # Xử lý sự kiện người dùng
└── assets/             # Icons, Demo templates
```

### Yêu cầu kỹ thuật cho tính năng mới:

1.  **Storage:** Sử dụng `window.localStorage` cho dữ liệu nhỏ (\<5MB) hoặc `IndexedDB` nếu người dùng đính kèm nhiều ảnh.
2.  **Export Selected:** Cần viết hàm lọc (filter) trong Graphology để trích xuất `sub-graph` (đồ thị con) trước khi xuất ra file JSON.

-----

## 5\. Hướng Dẫn Cài Đặt & Đóng Góp

**Dành cho lập trình viên:**

1.  Clone repo về máy.
2.  Mở bằng VS Code.
3.  Cài extension "Live Server".
4.  Chuột phải `index.html` -\> "Open with Live Server".

**Dành cho người dùng cuối (Sắp ra mắt):**

  * Truy cập vào đường link GitHub Pages (sẽ cung cấp sau).
  * Không cần cài đặt gì thêm.

