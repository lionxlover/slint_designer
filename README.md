# Slint Designer — Static Edition (HTML / CSS / JS, no server)

The complete Slint Designer v3 (fixed) converted to a **100% serverless** build.
Open `index.html` directly from disk (`file://`) or drop the folder on any static
host — no Node, no database, no API. Everything runs in the browser.

## Run it

- Double-click `index.html`, or
- Host the folder anywhere (GitHub Pages, Netlify, a USB stick...) — it is plain
  static files.

## What's inside

| File         | Purpose                                              |
|--------------|------------------------------------------------------|
| `index.html` | App shell (dark theme, mounts `#root`)              |
| `styles.css` | Tailwind CSS v4 build of the designer stylesheet     |
| `app.js`     | The whole app as one minified classic script (IIFE)  |
| `assets/`    | Favicon (`logo.svg`)                                 |

## How the server was removed

The Next.js version talked to a REST API backed by Prisma/SQLite for project
persistence. In this edition a `fetch` interceptor (bundled as part of `app.js`)
answers every `/api/projects*` request from **localStorage**, reproducing the
exact REST contract of the original API routes:

- `GET /api/projects` — list, `updatedAt` desc, search/limit/offset
- `POST /api/projects` — create (name + document validation, 400/422 semantics)
- `GET /api/projects/:id` — fetch one (404 when missing)
- `PUT /api/projects/:id` — autosave (debounced 1.2 s, Ctrl+S works)
- `DELETE /api/projects/:id` — delete (404 when missing)

If localStorage is unavailable (blocked, quota), the adapter degrades to
in-memory storage so the app keeps working for the session.

## Features (identical to the Next.js v3 build)

- 6 templates, drag & drop palette, 18 tools, indicators/gauges
- Layers + Assets panels, full property inspector (geometry, appearance,
  layout, transform, effects, behavior)
- Code generation with real-Slint compatibility fixes (v3)
- Import / export of `.slint` files (blob downloads work offline)
- Live preview tab compiles with the real Slint WASM compiler via slintpad.com
  (needs internet only for this tab; everything else works fully offline)
- Autosave, undo/redo, zoom presets, guides, rulers, present mode, workspace
  layouts, multi-file projects

## Rebuild from source

The generator sources live in the project repo:

```
static-src/            entry + localStorage API adapter
scripts/build-static.mjs   build script (bun)
bun scripts/build-static.mjs
```
