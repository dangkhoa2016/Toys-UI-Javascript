# Toy Tale Client

Static JavaScript client for the Toy API Server.

## Features

- List toys from the API or seed demo data when the API is empty.
- Create a toy with a modal form.
- Edit, like, and delete toys from each card.
- Search toys by name in real time.
- Sort toys by likes ascending, descending, or keep default order.
- Show toast notifications for successful and failed actions.
- Animate toy cards when they enter, update, reorder, or leave the shelf.

## Project Structure

- `index.html`: main page shell.
- `assets/js/main.js`: application bootstrap.
- `assets/js/app.js`: app orchestration, event wiring, and UI state.
- `assets/js/api.js`: REST API calls for list/create/update/like/delete flows.
- `assets/js/dom.js`: DOM rendering helpers for toy cards, toasts, and UI states.
- `assets/js/components.js`: reusable custom elements for static templates.
- `assets/js/config.js`: API URL, image normalization, and demo-data config.
- `assets/db.json`: fallback seed data for local/demo use.
- `assets/images/toys/`: normalized toy image library.

## Notes

- Toy cards use `loading="lazy"` for image loading.
- Legacy image paths such as `/imgs/...` and `/toys/...` are normalized in `config.js` for compatibility.
- The client points to the local API in localhost development and to the forwarded hosted API in remote environments.
- Search and sort are client-side views driven from the current in-memory toy state.
- List updates are DOM-preserving where possible, so like, create, delete, and likes-based reorder actions avoid full image reloads.
- Edit uses the existing `PUT /api/toys/:id` API route and preserves the current like count.
- Bootstrap toasts are rendered into a fixed stack in the top-right corner for action feedback.
