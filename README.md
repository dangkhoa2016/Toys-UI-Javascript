# Toy Tale Client (Vanilla JS)

> 🌐 Language / Ngôn ngữ: **English** | [Tiếng Việt](README.vi.md)

Static JavaScript client for Toy API Server.

This client is also used as a manual/integration test UI for the Toy API backend projects:
[Toy-Api-Server-Nodejs](https://github.com/dangkhoa2016/Toy-Api-Server-Nodejs)
and
[Toy-Api-Server-Cloudflare-Worker](https://github.com/dangkhoa2016/Toy-Api-Server-Cloudflare-Worker).

The app is built with HTML + ES Modules + Bootstrap (CDN), no bundler required.

## Technologies Used

- Core stack: `HTML5`, `CSS3`, and `Vanilla JavaScript` (`ES modules`).
- UI package/runtime: `Bootstrap 5.2.3` (loaded from jsDelivr CDN).
- Browser APIs: `Fetch API` and `Custom Elements` (Web Components).
- Local tooling: `npx serve` for static hosting in development.
- Backend integration targets: `Toy-Api-Server-Nodejs` and `Toy-Api-Server-Cloudflare-Worker` REST APIs.

## Feature Highlights

- Load toys from API and auto-seed demo data when API is empty.
- Show skeleton cards while loading and a full-screen mosaic loader for long-running actions.
- Create toy in modal form with real-time validation and debounced image preview verification.
- Edit toy without resetting current likes.
- Like toy instantly and optionally reorder cards when sort mode is based on likes.
- Delete toy with confirmation modal and busy-lock UX (buttons disabled while deleting).
- Search by toy name and sort by default / likes descending / likes ascending.
- Toast notifications for success, warning, and error states.
- Animated card entry, reorder, highlight, and removal transitions.

## Quick Start

### 1) Start API server (recommended)

Reference backend repositories (used for testing with this UI):

- https://github.com/dangkhoa2016/Toy-Api-Server-Nodejs
- https://github.com/dangkhoa2016/Toy-Api-Server-Cloudflare-Worker

Option A - run the Node.js backend from workspace root:

```bash
cd Toy-Api-Server-Nodejs
npm install
npm run dev
```

Option B - run the Cloudflare Worker backend from workspace root:

```bash
cd Toy-Api-Server-Cloudflare-Worker
npm install
cp .dev.vars.example .dev.vars
npm run dev
```

If you do not have the Node.js API project locally yet:

```bash
git clone https://github.com/dangkhoa2016/Toy-Api-Server-Nodejs.git
cd Toy-Api-Server-Nodejs
npm install
npm run dev
```

Default API URL expected by this client on localhost is:

```text
http://localhost:8080/api/toys
```

If you use the Cloudflare Worker locally, override the API URL to its local Wrangler address before loading the app, for example:

```html
<script>
	window.TOY_API_URL = "http://127.0.0.1:8787/api/toys";
</script>
```

### 2) Run this client with `npx serve`

From this project folder:

```bash
cd Toys-UI-Javascript
npx serve .
```

You can also choose a fixed port:

```bash
npx serve . -l 4173
```

Then open the local URL printed by serve (for example `http://localhost:4173`).

## API Endpoint Behavior

`assets/js/config.js` chooses API endpoint by hostname:

- On `localhost` / `127.0.0.1`: uses `http://localhost:8080/api/toys`.
- On non-local hosts: uses the forwarded hosted API fallback.

You can override API URL globally before loading `main.js`:

```html
<script>
	window.TOY_API_URL = "https://your-api.example.com/api/toys";
</script>
```

## Project Structure

| Path | Responsibility |
| --- | --- |
| `index.html` | App shell, root layout, global script/style includes, custom element placeholders |
| `assets/css/styles.css` | UI styling, responsive rules, loaders, card animation, skeleton styles |
| `assets/js/main.js` | Bootstrap sequence (`registerComponents` -> `initApp`) |
| `assets/js/app.js` | Main orchestration: events, CRUD flows, search/sort, modal lifecycle, toast workflow |
| `assets/js/components.js` | Static custom elements (`top-action`, forms, confirm modal, skeleton, mosaic loader) |
| `assets/js/dom.js` | DOM render/update helpers, animation helpers, collection status, toasts, busy states |
| `assets/js/toyService.js` | API integration layer (GET/POST/PUT/PATCH/DELETE), error normalization |
| `assets/js/toyStore.helpers.js` | In-memory state helpers, filtering/sorting logic, toast payload state |
| `assets/js/toyForm.js` | Validation rules, preview lifecycle state, submit lock rules |
| `assets/js/modalForm.js` | Modal backdrop observer and managed form reset helpers |
| `assets/js/config.js` | Centralized constants/enums, URL normalization, API URL selection |
| `assets/js/api.js` | Compatibility re-export of `toyService.js` |
| `assets/db.json` | Demo seed data used when server has no toys |
| `assets/images/toys/` | Local toy image assets |
| `screenshots/` | UI screenshots used in documentation |

## Runtime Notes

- Toy cards use `loading="lazy"` to defer image loading.
- Relative toy image paths and legacy forms like `/imgs/...` or `/toys/...` are normalized in `config.js`.
- Search and sort are client-side views over current in-memory state.
- Delete confirmation modal enters busy mode during delete request:
	- Header close button is hidden/disabled.
	- Footer close + confirm buttons are disabled.
	- Modal close is blocked until request finishes.
- If API has no data, app displays seeding status and creates sample toys from `assets/db.json`.
- If API is unreachable, app shows error panel with reload button and danger toast.

## Screenshot Gallery

The full screenshot gallery has been moved to [SCREENSHOTS.md](SCREENSHOTS.md).
For Vietnamese captions, see [SCREENSHOTS.vi.md](SCREENSHOTS.vi.md).

## Troubleshooting

- **Unable to load toys**:
	- Ensure API server is running on `http://localhost:8080`.
	- Check browser console/network tab for CORS or connectivity errors.
	- Click **Reload data** in the app status panel.
- **Image preview stays locked**:
	- Use valid `http://` or `https://` image URL.
	- Or use a valid local toy image path from `assets/images/toys/`.

## Developer Reference

For a detailed overview of the project architecture, key files, data flows, and parity notes with [`Toys-UI-VueJs`](https://github.com/dangkhoa2016/Toys-UI-VueJs), see [REFERENCE.md](REFERENCE.md).
For the Vietnamese version, see [REFERENCE.vi.md](REFERENCE.vi.md).

## License

This project is for development/demo purposes in this workspace.
