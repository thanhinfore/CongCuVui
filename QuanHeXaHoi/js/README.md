# Contact Map v7.5 - Modular Architecture

## Cấu trúc thư mục

```
js/
├── main.js              # Entry point chính
├── README.md            # Tài liệu này
│
├── core/                # Modules lõi
│   ├── config.js        # Constants, cấu hình mặc định
│   ├── state.js         # Quản lý state toàn cục
│   ├── storage.js       # IndexedDB & localStorage
│   └── graph.js         # Graph operations (Graphology)
│
├── ui/                  # UI Components
│   ├── commandPalette.js  # Command Palette (Ctrl+K)
│   ├── multiSelect.js     # Multi-select & bulk operations
│   ├── theme.js           # Dark/Light mode
│   └── keyboard.js        # Keyboard shortcuts
│
├── features/            # Feature modules (tương lai)
│   ├── import.js        # Import functionality
│   ├── export.js        # Export functionality
│   └── layouts.js       # Layout algorithms
│
└── utils/               # Tiện ích
    ├── helpers.js       # Utility functions
    └── toast.js         # Toast notifications
```

## Nguyên tắc thiết kế

### 1. Separation of Concerns
- Mỗi module chỉ làm một việc
- Core modules không phụ thuộc UI
- UI modules có thể thay thế dễ dàng

### 2. Single Source of Truth
- State tập trung trong `state.js`
- Config tập trung trong `config.js`

### 3. Dependency Injection
- Callbacks được truyền vào setup functions
- Dễ test và mock

## Cách sử dụng

### Import modules
```javascript
import { showToast } from './utils/toast.js';
import { state, refs } from './core/state.js';
import { addNode, saveGraph } from './core/graph.js';
```

### Thêm feature mới
1. Tạo file mới trong thư mục phù hợp
2. Export các functions cần thiết
3. Import và sử dụng trong main.js

### Ví dụ thêm UI component
```javascript
// js/ui/myComponent.js
export function setupMyComponent(callbacks = {}) {
    // Setup code here
}

export function doSomething() {
    // Implementation
}
```

## Keyboard Shortcuts

| Phím | Chức năng |
|------|-----------|
| `Ctrl+K` | Command Palette |
| `N` | Thêm người mới |
| `/` | Tìm kiếm |
| `Ctrl+A` | Chọn tất cả |
| `ESC` | Đóng/Bỏ chọn |
| `Delete` | Xóa đã chọn |
| `Ctrl+Click` | Multi-select |

## Migration từ index.js cũ

File `index.js` cũ vẫn hoạt động. Để migrate:

1. Dần dần import modules mới
2. Thay thế code cũ bằng module calls
3. Khi hoàn tất, đổi entry point sang `main.js`

## Future improvements

- [ ] Tách modal components
- [ ] Tách detail panel
- [ ] Tách search functionality
- [ ] Tách drag & drop
- [ ] Tách layout algorithms
- [ ] Unit tests cho mỗi module
- [ ] TypeScript support
