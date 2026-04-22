# Toys-UI-Javascript Reference

> 🌐 Language / Ngôn ngữ: **English** | [Tiếng Việt](REFERENCE.vi.md)

## Purpose

This document serves as a quick reference for the structure and core logic of the [`Toys-UI-Javascript`](https://github.com/dangkhoa2016/Toys-UI-Javascript) project, and records differences from the [`Toys-UI-VueJs`](https://github.com/dangkhoa2016/Toys-UI-VueJs) version.

---

## Architecture Overview

The project uses **plain JavaScript**, with no reactive framework.

- UI is built with HTML, custom elements, and imperative DOM updates.
- State is managed in a local `state` object inside `initApp()`.
- `app.js` is the coordination center: it wires DOM events, calls services, uses DOM helpers, and mutates local state.
- Bootstrap 5 is used for modals and toasts.

---

## Entry Points

| File | Description |
|---|---|
| `index.html` | Page shell, `#toy-collection`, custom element mounts, `#toast-region`, Bootstrap runtime, main script module |
| `assets/js/main.js` | Bootstraps the app: calls `registerComponents()` then `initApp()` |
| `assets/js/components.js` | Defines custom elements for add/edit forms, top actions, confirm modal, loader, and skeleton |

---

## Key Files

### `assets/js/app.js` — Application Center

- The main coordinator for UI behavior.
- Creates `state` via `createToyStoreState()` from `toyStore.helpers.js` and keeps it local inside `initApp()`.
- Looks up required DOM nodes with `requireElement()` and initializes 3 Bootstrap modals: add, edit, and delete confirm.
- Registers event listeners for search, sort, add button, form input and submit, collection button clicks, delete confirmation, and back-to-top.
- Key internal functions include:
  - `renderVisibleToys()` — calls `getVisibleToys(state)` then `renderToyList()`.
  - `showAppToast({...})` — creates a toast via `createToast()` and shows it with `bootstrap.Toast`.
  - `syncFormSubmitState(form)` — computes the current disable reason and updates the submit button.
  - `queueImagePreview(form, { immediate? })` — debounces preview checks and updates form preview state.
  - `loadInitialToys()` — fetches toys first, then seeds demo data when the API returns an empty list.
  - `submitCreateToy(event)`, `submitUpdateToy(event)`, `submitDeleteToy()`, `incrementToyLikes(toyId)`.
  - `openEditToy(toyId)` — populates and opens the edit modal.

### `assets/js/toyStore.helpers.js` — State Helpers

- **`state.toys` is a `Map<string, toy>`** for O(1) lookup by id.
- `createToyStoreState()` — creates initial state for `toys`, `searchTerm`, `sortOrder`, `toasts`, `highlightedToy`, `editingToyId`, and `confirmDeleteToyId`.
- `syncToyState(state, toys)` — normalizes an array and replaces the full `Map`.
- `prependToyState(state, toy)` — prepends a toy by rebuilding the `Map` with the new toy first.
- `updateToyState(state, toy)` — normalizes and updates a toy in place by id.
- `removeToyState(state, toyId)` — removes a toy from the `Map`.
- `getVisibleToys(state)` — filters and sorts from `Array.from(state.toys.values())`.
- `flashToyState(state, toyId)` — stores `highlightedToy` with `nonce = Date.now()`.
- `addToastState(state, payload)` / `removeToastState(state, id)`.
- `getToastMessage(error, fallback)` — extracts a displayable error message.

### `assets/js/config.js` — Constants and Utilities

- `TOY_API_URL` — backend URL, prefers `window.TOY_API_URL` if set.
- `DEMO_DATA_PATH` — `/assets/db.json`.
- `TOY_FORM_TIMINGS.IMAGE_PREVIEW_DEBOUNCE_MS` — debounce delay for image preview checks.
- `TOY_UI_DELAYS` — includes `HIGHLIGHT_RESET_MS` and `RELOAD_AFTER_MS`.
- `TOY_UI_LIMITS.SCROLL_TOP_VISIBLE_OFFSET_PX` — threshold for showing the back-to-top control.
- `TOY_ANIMATION_SETTINGS` — card animation parameters.
- `TOY_TEMPLATE_SETTINGS.SKELETON_CARD_COUNT` — number of skeleton cards shown during loading.
- `normalizeToyImageUrl(image)` — normalizes image paths to `/assets/images/toys/`.
- `toApiImageUrl(image)` — converts local image paths to absolute URLs for API submission.
- `normalizeToy(toy)` — trims `name`, normalizes `image`, and ensures `likes >= 0`.

### `assets/js/toyService.js` — API Calls

- Uses `TOY_API_URL` from config directly; there is no `endpoint` parameter.
- `fetchToys()` — GET toy list.
- `seedDemoToys(onEach?)` — POST demo toys from `db.json`, calling `onEach(toy)` after each success.
- `fetchOrSeedToys()` — if the list is empty, seeds and returns `seededToys` without re-fetching.
- `createToy({ name, image })` — POST a new toy with `likes: 0`.
- `updateToy(id, { name, image, likes })` — PUT a toy.
- `likeToy(toy)` — PATCH `/likes`.
- `deleteToy(toyId)` — DELETE a toy.
- Includes `ApiError` and `formatServerErrorMessage()` to normalize server errors.

### `assets/js/dom.js` — DOM Rendering

- Renders and diffs the toy card list with `renderToyList()`.
- Animates card entry, removal, and reorder with `animateToyRemoval()` and `reorderToyCards()`.
- `updateToyLikes(container, toyId, likes)` — updates the like count directly on the DOM.
- `markToyCardUpdated(container, toyId)` — adds a temporary highlight class.
- `setEditTarget(modalElement, toy)` / `setDeleteTarget(modalElement, toy)` — populate modal content.
- `createToast(payload)` — creates the Bootstrap toast DOM element.
- `showCollectionMessage()` / `showSeedingMessage()` — render collection status states.

### `assets/js/toyForm.js` — Form Validation and Preview

- `IMAGE_PREVIEW_DEBOUNCE_MS` — sourced from `TOY_FORM_TIMINGS` in config.
- `getNameError(value)` / `getImageError({ value, normalizedImageUrl, preview })` — return an error string or an empty string.
- `loadImagePreview(src)` — tests image loading with `new Image()`.
- `getSubmitDisableReason({...})` — determines why the submit button is disabled.
- Also exports preview messages and helpers reused by `app.js`.

### `assets/js/modalForm.js` — Modal Helpers

- `armModalBackdropObserver(target)` — watches modal backdrop insertion and normalizes its classes.
- `stopModalBackdropObserver(target)` — disconnects the active observer.
- `focusFormField(root, selector?)` — focuses a field after the modal opens.
- `resetManagedForm({ ...options })` — resets the form, busy state, validation, preview state, and post-reset hooks.

---

## Main Flows

### 1. Startup and Data Load

1. `main.js` calls `registerComponents()` then `initApp()`.
2. `app.js` finds required DOM elements via `requireElement()` and initializes Bootstrap modals.
3. `loadInitialToys()` calls `fetchToys()`.
4. If the list is empty, it shows the seeding message and calls `seedDemoToys(onEach)`.
5. After each successful POST during seeding:
   - `prependToyState(state, toy)`
   - `renderVisibleToys()` immediately
6. After seeding completes, `syncToyState(state, toys)` replaces the full Map.
7. There is no re-fetch after seeding.

### 2. Create Toy

1. The user clicks the add button, and `addToyModal.show()` opens `#modal-add-toy`.
2. The image field uses a debounced preview check, and submit stays disabled until the form is valid and preview is ready.
3. `submitCreateToy(event)` validates the form, calls the API, prepends state, re-renders, resets the form, closes the modal, and shows a toast.

### 3. Update Toy

1. The edit button is handled through click delegation on `#toy-collection`.
2. `openEditToy(toyId)` looks up the toy, calls `setEditTarget()`, triggers immediate preview sync, and opens the edit modal.
3. Submit calls the update API, then `updateToyState()` → `renderVisibleToys()` → `flashToyCard()` → toast.

### 4. Delete Toy

1. The delete button is handled through click delegation on `#toy-collection`.
2. `app.js` stores `confirmDeleteToyId`, calls `setDeleteTarget()`, clears busy state, and opens the confirm modal.
3. `submitDeleteToy()` calls the delete API.
4. On success: close modal → `animateToyRemoval()` → `removeToyState()` → `renderVisibleToys()` → toast.

### 5. Like Toy

1. The like button is handled through click delegation on `#toy-collection`.
2. `incrementToyLikes(toyId)` calls the API and updates the current toy in the `Map` via `updateToyState()`.
3. `updateToyLikes()` updates the visible count immediately.
4. If sort order is likes-based, `reorderToyCards()` tries to reorder existing cards; otherwise the current view may re-render depending on sort mode.
5. `flashToyCard()` shows the update and a toast reports the new like count.

---

## Differences from Toys-UI-VueJs

| Aspect | Toys-UI-Javascript | Toys-UI-VueJs |
|---|---|---|
| Framework | None | Vue 2 + Vuex + bootstrap-vue |
| State management | Local object in `initApp()` | Vuex store modules (`appStore`, `toyStore`) |
| UI rendering | Imperative DOM via `dom.js` | `.vue` components + computed/watchers |
| `state.toys` | `Map<string, toy>` | `Array<toy>` |
| Runtime endpoint | Fixed from `TOY_API_URL` in config | `appStore` stores a runtime endpoint override, but the current UI does not expose an endpoint picker |
| Service parameters | No `endpoint` param | API-facing functions accept `endpoint` |
| `createToy` / `updateToy` | `createToy` sends `name` and `image`; `updateToy` also sends `likes` | Also accepts `enabled` |
| Network retry | None | `fetchWithRetry` in `utils.js` |
| Animation | Web Animations API via `dom.js` | No dedicated card animation layer |
| Toast | Bootstrap 5 Toast direct DOM | Custom `toast-region` driven by Vuex state |
| Like optimization | `updateToyLikes()` updates DOM directly, with targeted reorder/re-render logic | `UPSERT_TOY` + component re-render |

---

## Notes on Parity

- `fetchOrSeedToys()` returns `seededToys` directly after seeding, without re-fetching, matching the VueJs version.
- `IMAGE_PREVIEW_DEBOUNCE_MS` is sourced from `TOY_FORM_TIMINGS`, consistent with the VueJs version.

---

## How to Navigate the Code

For a specific use case, read in this order:

1. `assets/js/main.js` — entry point
2. `assets/js/app.js` — main control flow for the use case
3. `assets/js/dom.js` — if the use case involves rendering or animation
4. `assets/js/toyService.js` — if related to an API call
5. `assets/js/toyStore.helpers.js` — if related to state mutation
6. `assets/js/toyForm.js` + `assets/js/modalForm.js` — if related to forms or modals
7. `assets/js/components.js` — if you want to inspect the HTML templates