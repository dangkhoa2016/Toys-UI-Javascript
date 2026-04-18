# Toy Tale Client (Vanilla JS)

> 🌐 Language / Ngôn ngữ: [English](README.md) | **Tiếng Việt**

Ứng dụng client JavaScript tĩnh cho Toy API Server.

Client này cũng đang được dùng như giao diện test thủ công/integration cho các dự án backend Toy API:
[Toy-Api-Server-Nodejs](https://github.com/dangkhoa2016/Toy-Api-Server-Nodejs)
và
[Toy-Api-Server-Cloudflare-Worker](https://github.com/dangkhoa2016/Toy-Api-Server-Cloudflare-Worker).

Dự án được xây dựng bằng HTML + ES Modules + Bootstrap (CDN), không cần bundler.

## Công nghệ sử dụng

- Stack chính: `HTML5`, `CSS3`, và `Vanilla JavaScript` (`ES modules`).
- UI package/runtime: `Bootstrap 5.2.3` (nạp từ jsDelivr CDN).
- Browser APIs: `Fetch API` và `Custom Elements` (Web Components).
- Tool local: `npx serve` để chạy static hosting khi phát triển.
- Backend tích hợp: REST API từ `Toy-Api-Server-Nodejs` và `Toy-Api-Server-Cloudflare-Worker`.

## Tính Năng Nổi Bật

- Tải danh sách toys từ API và tự động seed dữ liệu demo khi server chưa có dữ liệu.
- Hiển thị skeleton cards khi đang tải, kèm full-screen mosaic loader cho các thao tác lâu hơn.
- Tạo toy trong modal form với validation thời gian thực và kiểm tra preview ảnh có debounce.
- Chỉnh sửa toy mà không reset số likes hiện tại.
- Tăng likes tức thì và có thể tự sắp xếp lại cards khi sort theo likes.
- Xóa toy bằng modal xác nhận với busy-lock UX (disable nút khi đang xóa).
- Tìm kiếm theo tên toy và sắp xếp theo mặc định / likes giảm dần / likes tăng dần.
- Toast notifications cho trạng thái thành công, cảnh báo và lỗi.
- Hiệu ứng animation cho card khi thêm mới, sắp xếp lại, highlight và xóa.

## Bắt Đầu Nhanh

### 1) Khởi động API server (khuyến nghị)

Các repository backend tham chiếu (được dùng để test cùng UI này):

- https://github.com/dangkhoa2016/Toy-Api-Server-Nodejs
- https://github.com/dangkhoa2016/Toy-Api-Server-Cloudflare-Worker

Lựa chọn A - chạy backend Node.js từ thư mục gốc workspace:

```bash
cd Toy-Api-Server-Nodejs
npm install
npm run dev
```

Lựa chọn B - chạy backend Cloudflare Worker từ thư mục gốc workspace:

```bash
cd Toy-Api-Server-Cloudflare-Worker
npm install
cp .dev.vars.example .dev.vars
npm run dev
```

Nếu bạn chưa có project Node.js API trên máy:

```bash
git clone https://github.com/dangkhoa2016/Toy-Api-Server-Nodejs.git
cd Toy-Api-Server-Nodejs
npm install
npm run dev
```

Endpoint API mặc định mà client dùng trên localhost:

```text
http://localhost:8080/api/toys
```

Nếu bạn chạy Cloudflare Worker ở local, hãy override API URL sang địa chỉ Wrangler local trước khi app được tải, ví dụ:

```html
<script>
  window.TOY_API_URL = "http://127.0.0.1:8787/api/toys";
</script>
```

### 2) Chạy client bằng `npx serve`

Từ thư mục dự án này:

```bash
cd Toys-UI-Javascript
npx serve .
```

Bạn cũng có thể chọn port cố định:

```bash
npx serve . -l 4173
```

Sau đó mở URL local được in ra bởi serve (ví dụ `http://localhost:4173`).

## Cách Chọn API Endpoint

`assets/js/config.js` chọn API endpoint dựa trên hostname:

- Trên `localhost` / `127.0.0.1`: dùng `http://localhost:8080/api/toys`.
- Trên host không phải local: dùng endpoint API fallback đã forward.

Bạn có thể override API URL global trước khi tải `main.js`:

```html
<script>
	window.TOY_API_URL = "https://your-api.example.com/api/toys";
</script>
```

## Cấu Trúc Dự Án

| Đường dẫn | Vai trò |
| --- | --- |
| `index.html` | Khung trang chính, bố cục gốc, include script/style toàn cục, vị trí placeholder cho custom elements |
| `assets/css/styles.css` | Toàn bộ style UI, responsive rules, loaders, animation cards, skeleton styles |
| `assets/js/main.js` | Trình tự bootstrap (`registerComponents` -> `initApp`) |
| `assets/js/app.js` | Điều phối chính: events, CRUD flows, search/sort, vòng đời modal, toast workflow |
| `assets/js/components.js` | Custom elements tĩnh (`top-action`, forms, confirm modal, skeleton, mosaic loader) |
| `assets/js/dom.js` | Các helper render/update DOM, animation helpers, collection status, toasts, busy states |
| `assets/js/toyService.js` | Tầng tích hợp API (GET/POST/PUT/PATCH/DELETE), chuẩn hóa lỗi |
| `assets/js/toyStore.helpers.js` | Helper state in-memory, logic filter/sort, toast payload state |
| `assets/js/toyForm.js` | Validation rules, preview lifecycle state, submit lock rules |
| `assets/js/modalForm.js` | Helper quan sát backdrop modal và reset form có quản lý |
| `assets/js/config.js` | Bộ constants/enums tập trung, chuẩn hóa URL, chọn API URL |
| `assets/js/api.js` | File tương thích, re-export từ `toyService.js` |
| `assets/db.json` | Dữ liệu demo dùng để seed khi server chưa có toys |
| `assets/images/toys/` | Ảnh toy local |
| `screenshots/` | Ảnh chụp màn hình dùng cho tài liệu |

## Ghi Chú Runtime

- Toy cards dùng `loading="lazy"` để trì hoãn tải ảnh.
- Đường dẫn ảnh tương đối và các dạng cũ như `/imgs/...` hoặc `/toys/...` được chuẩn hóa trong `config.js`.
- Search và sort là view phía client trên state in-memory hiện tại.
- Modal xác nhận xóa sẽ vào trạng thái bận khi gọi request xóa.
- Nút đóng ở header sẽ bị ẩn/vô hiệu hóa trong lúc xóa.
- Nút Close và Yes ở footer sẽ bị vô hiệu hóa trong lúc xóa.
- Modal không thể đóng cho tới khi request xóa hoàn tất.
- Nếu API chưa có dữ liệu, app hiển thị trạng thái seeding và tạo dữ liệu mẫu từ `assets/db.json`.
- Nếu API không truy cập được, app hiển thị panel lỗi có nút reload và danger toast.

## Thư Viện Ảnh Chụp Màn Hình

Bộ ảnh đầy đủ đã được tách ra tại [SCREENSHOTS.vi.md](SCREENSHOTS.vi.md).
Nếu muốn xem bản tiếng Anh, mở [SCREENSHOTS.md](SCREENSHOTS.md).

## Khắc Phục Sự Cố

- **Unable to load toys**:
  - Hãy chắc chắn API server đang chạy tại `http://localhost:8080`.
  - Kiểm tra browser console/network tab để xem lỗi CORS hoặc kết nối.
  - Bấm **Reload data** trong panel trạng thái của app.
- **Image preview stays locked**:
  - Dùng URL ảnh hợp lệ bắt đầu bằng `http://` hoặc `https://`.
  - Hoặc dùng đường dẫn ảnh local hợp lệ trong `assets/images/toys/`.

## Tài Liệu Tham Khảo Dành Cho Developer

Để xem tổng quan chi tiết về kiến trúc dự án, các file quan trọng, luồng dữ liệu và các điểm parity với [`Toys-UI-VueJs`](https://github.com/dangkhoa2016/Toys-UI-VueJs), xem [REFERENCE.vi.md](REFERENCE.vi.md).
Bản tiếng Anh: [REFERENCE.md](REFERENCE.md).

## Giấy Phép

Dự án này dùng cho mục đích phát triển/demo trong workspace hiện tại.
