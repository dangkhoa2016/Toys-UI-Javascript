# Toys-UI-Javascript Reference

> 🌐 Language / Ngôn ngữ: [English](REFERENCE.md) | **Tiếng Việt**

## Mục đích

Tài liệu này dùng để tra nhanh cấu trúc và logic chính của dự án [`Toys-UI-Javascript`](https://github.com/dangkhoa2016/Toys-UI-Javascript), đồng thời ghi lại các điểm khác biệt so với bản [`Toys-UI-VueJs`](https://github.com/dangkhoa2016/Toys-UI-VueJs).

---

## Tổng quan kiến trúc

Dự án dùng **JavaScript thuần**, không có framework reactive.

- UI được xây bằng HTML, custom elements, và cập nhật DOM kiểu imperative.
- State được quản lý trong một object `state` cục bộ bên trong `initApp()`.
- `app.js` là trung tâm điều phối: nối DOM events, gọi service, dùng DOM helpers, và cập nhật local state.
- Bootstrap 5 được dùng cho modal và toast.

---

## Điểm vào chính

| File | Mô tả |
|---|---|
| `index.html` | Khung trang, `#toy-collection`, vị trí mount custom elements, `#toast-region`, Bootstrap runtime, script module chính |
| `assets/js/main.js` | Bootstraps app: gọi `registerComponents()` rồi `initApp()` |
| `assets/js/components.js` | Định nghĩa custom elements cho add/edit form, top actions, modal confirm, loader, skeleton |

---

## File quan trọng

### `assets/js/app.js` — Trung tâm ứng dụng

- File điều phối chính của UI.
- Tạo `state` bằng `createToyStoreState()` từ `toyStore.helpers.js` và giữ nó cục bộ trong `initApp()`.
- Tìm các DOM node cần thiết bằng `requireElement()` và khởi tạo 3 Bootstrap modal: add, edit, delete confirm.
- Đăng ký event listeners cho search, sort, add button, input và submit của form, click trên collection, xác nhận xóa, và back-to-top.
- Các hàm nội bộ quan trọng gồm:
  - `renderVisibleToys()` — gọi `getVisibleToys(state)` rồi `renderToyList()`.
  - `showAppToast({...})` — tạo toast qua `createToast()` và show bằng `bootstrap.Toast`.
  - `syncFormSubmitState(form)` — tính lý do disable hiện tại và cập nhật submit button.
  - `queueImagePreview(form, { immediate? })` — debounce việc check preview và cập nhật preview state.
  - `loadInitialToys()` — fetch danh sách trước, sau đó seed demo data nếu API trả về rỗng.
  - `submitCreateToy(event)`, `submitUpdateToy(event)`, `submitDeleteToy()`, `incrementToyLikes(toyId)`.
  - `openEditToy(toyId)` — nạp dữ liệu và mở modal edit.

### `assets/js/toyStore.helpers.js` — State helpers

- **`state.toys` là `Map<string, toy>`** để lookup theo id theo thời gian O(1).
- `createToyStoreState()` — tạo state ban đầu cho `toys`, `searchTerm`, `sortOrder`, `toasts`, `highlightedToy`, `editingToyId`, và `confirmDeleteToyId`.
- `syncToyState(state, toys)` — normalize array rồi thay toàn bộ `Map`.
- `prependToyState(state, toy)` — đưa toy lên đầu bằng cách dựng lại `Map` với toy mới ở trước.
- `updateToyState(state, toy)` — normalize rồi cập nhật toy theo id tại chỗ.
- `removeToyState(state, toyId)` — xóa toy khỏi `Map`.
- `getVisibleToys(state)` — filter + sort từ `Array.from(state.toys.values())`.
- `flashToyState(state, toyId)` — lưu `highlightedToy` với `nonce = Date.now()`.
- `addToastState(state, payload)` / `removeToastState(state, id)`.
- `getToastMessage(error, fallback)` — extract ra message có thể hiển thị.

### `assets/js/config.js` — Hằng số và utilities

- `TOY_API_URL` — URL backend, ưu tiên `window.TOY_API_URL` nếu có.
- `DEMO_DATA_PATH` — `/assets/db.json`.
- `TOY_FORM_TIMINGS.IMAGE_PREVIEW_DEBOUNCE_MS` — debounce cho check preview ảnh.
- `TOY_UI_DELAYS` — gồm `HIGHLIGHT_RESET_MS` và `RELOAD_AFTER_MS`.
- `TOY_UI_LIMITS.SCROLL_TOP_VISIBLE_OFFSET_PX` — ngưỡng hiện nút back-to-top.
- `TOY_ANIMATION_SETTINGS` — các tham số animation của card.
- `TOY_TEMPLATE_SETTINGS.SKELETON_CARD_COUNT` — số skeleton cards khi loading.
- `normalizeToyImageUrl(image)` — chuẩn hóa path ảnh về `/assets/images/toys/`.
- `toApiImageUrl(image)` — đổi path local thành absolute URL để gửi API.
- `normalizeToy(toy)` — trim `name`, normalize `image`, và đảm bảo `likes >= 0`.

### `assets/js/toyService.js` — API calls

- Dùng trực tiếp `TOY_API_URL` từ config; không có tham số `endpoint`.
- `fetchToys()` — GET danh sách.
- `seedDemoToys(onEach?)` — POST demo toys từ `db.json`, gọi `onEach(toy)` sau mỗi lần thành công.
- `fetchOrSeedToys()` — nếu danh sách rỗng thì seed và trả về `seededToys`, không re-fetch.
- `createToy({ name, image })` — POST toy mới với `likes: 0`.
- `updateToy(id, { name, image, likes })` — PUT toy.
- `likeToy(toy)` — PATCH `/likes`.
- `deleteToy(toyId)` — DELETE toy.
- Có `ApiError` và `formatServerErrorMessage()` để chuẩn hóa lỗi từ server.

### `assets/js/dom.js` — DOM rendering

- Render và diff danh sách toy cards bằng `renderToyList()`.
- Animate card entry, removal, reorder bằng `animateToyRemoval()` và `reorderToyCards()`.
- `updateToyLikes(container, toyId, likes)` — cập nhật số likes trực tiếp trên DOM.
- `markToyCardUpdated(container, toyId)` — thêm class highlight tạm thời.
- `setEditTarget(modalElement, toy)` / `setDeleteTarget(modalElement, toy)` — nạp nội dung cho modal.
- `createToast(payload)` — tạo DOM element cho Bootstrap toast.
- `showCollectionMessage()` / `showSeedingMessage()` — render trạng thái của collection.

### `assets/js/toyForm.js` — Form validation và preview

- `IMAGE_PREVIEW_DEBOUNCE_MS` — lấy từ `TOY_FORM_TIMINGS` trong config.
- `getNameError(value)` / `getImageError({ value, normalizedImageUrl, preview })` — trả về error string hoặc chuỗi rỗng.
- `loadImagePreview(src)` — test load ảnh bằng `new Image()`.
- `getSubmitDisableReason({...})` — xác định lý do disable nút submit.
- Ngoài ra còn export các preview message và helper được `app.js` dùng lại.

### `assets/js/modalForm.js` — Modal helpers

- `armModalBackdropObserver(target)` — theo dõi lúc backdrop của modal được thêm vào DOM và chuẩn hóa class của nó.
- `stopModalBackdropObserver(target)` — ngắt observer đang hoạt động.
- `focusFormField(root, selector?)` — focus field sau khi modal mở.
- `resetManagedForm({ ...options })` — reset form, busy state, validation, preview state, và các hook sau reset.

---

## Flow chính

### 1. Khởi động và load dữ liệu

1. `main.js` gọi `registerComponents()` rồi `initApp()`.
2. `app.js` tìm các DOM element cần thiết bằng `requireElement()` và khởi tạo Bootstrap modals.
3. `loadInitialToys()` gọi `fetchToys()`.
4. Nếu danh sách rỗng, nó hiện seeding message và gọi `seedDemoToys(onEach)`.
5. Sau mỗi request POST thành công khi seed:
   - `prependToyState(state, toy)`
   - `renderVisibleToys()` ngay lập tức
6. Sau khi seed xong, `syncToyState(state, toys)` thay lại toàn bộ `Map`.
7. Không re-fetch danh sách sau khi seed.

### 2. Create toy

1. User bấm nút add và `addToyModal.show()` mở `#modal-add-toy`.
2. Trường image dùng debounce để check preview, và submit chỉ mở khóa khi form hợp lệ và preview sẵn sàng.
3. `submitCreateToy(event)` validate form, gọi API, prepend state, re-render, reset form, đóng modal, và hiện toast.

### 3. Update toy

1. Nút edit được xử lý qua click delegation trên `#toy-collection`.
2. `openEditToy(toyId)` tìm toy, gọi `setEditTarget()`, đồng bộ preview ngay, rồi mở modal edit.
3. Submit gọi API update, sau đó `updateToyState()` → `renderVisibleToys()` → `flashToyCard()` → toast.

### 4. Delete toy

1. Nút delete được xử lý qua click delegation trên `#toy-collection`.
2. `app.js` lưu `confirmDeleteToyId`, gọi `setDeleteTarget()`, clear busy state, rồi mở modal confirm.
3. `submitDeleteToy()` gọi API delete.
4. Khi thành công: đóng modal → `animateToyRemoval()` → `removeToyState()` → `renderVisibleToys()` → toast.

### 5. Like toy

1. Nút like được xử lý qua click delegation trên `#toy-collection`.
2. `incrementToyLikes(toyId)` gọi API và cập nhật toy hiện tại trong `Map` bằng `updateToyState()`.
3. `updateToyLikes()` cập nhật số likes đang hiển thị ngay trên DOM.
4. Nếu đang sort theo likes, `reorderToyCards()` sẽ cố reorder các card hiện có; nếu không thì view có thể re-render tùy sort mode.
5. `flashToyCard()` hiển thị highlight và toast báo số likes mới.

---

## Khác biệt so với Toys-UI-VueJs

| Khía cạnh | Toys-UI-Javascript | Toys-UI-VueJs |
|---|---|---|
| Framework | Không có | Vue 2 + Vuex + bootstrap-vue |
| State management | Object cục bộ trong `initApp()` | Vuex store modules (`appStore`, `toyStore`) |
| Render UI | DOM imperative qua `dom.js` | Component `.vue` + computed/watcher |
| `state.toys` | `Map<string, toy>` | `Array<toy>` |
| Endpoint runtime | Cố định từ `TOY_API_URL` trong config | `appStore` lưu endpoint override ở runtime, nhưng UI hiện tại chưa có bộ chọn endpoint |
| Tham số service | Không có `endpoint` param | Các hàm gọi API nhận `endpoint` |
| `createToy` / `updateToy` | `createToy` gửi `name` và `image`; `updateToy` gửi thêm `likes` | Nhận thêm `enabled` |
| Network retry | Không có | `fetchWithRetry` trong `utils.js` |
| Animation | Web Animations API qua `dom.js` | Không có lớp animation card riêng |
| Toast | Bootstrap 5 Toast trực tiếp trên DOM | `toast-region` custom dùng state từ Vuex |
| Tối ưu like | `updateToyLikes()` cập nhật DOM trực tiếp, kèm targeted reorder/re-render | `UPSERT_TOY` + component re-render |

---

## Điểm cần lưu ý khi đối chiếu parity

- `fetchOrSeedToys()` trả về `seededToys` trực tiếp sau khi seed, không re-fetch, tương ứng với bản VueJs.
- `IMAGE_PREVIEW_DEBOUNCE_MS` được lấy từ `TOY_FORM_TIMINGS`, đồng nhất với bản VueJs.

---

## Cách đọc code nhanh

Nếu cần theo một use case cụ thể, nên đọc theo thứ tự sau:

1. `assets/js/main.js` — điểm vào
2. `assets/js/app.js` — control flow chính của use case
3. `assets/js/dom.js` — nếu use case liên quan đến render hoặc animation
4. `assets/js/toyService.js` — nếu liên quan đến API call
5. `assets/js/toyStore.helpers.js` — nếu liên quan đến state mutation
6. `assets/js/toyForm.js` + `assets/js/modalForm.js` — nếu liên quan đến form hoặc modal
7. `assets/js/components.js` — nếu muốn xem HTML templates