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

## Devices & install

Works on desktop, tablet and phone (Chrome, Edge, Firefox, Safari / iOS Safari, Android Chrome).

- **Install as an app:** open the hosted site → browser menu → *Install* / *Add to Home Screen*. Works offline after the first visit (the Live preview tab still needs internet).
- **Phones & portrait tablets (< 1024 px):** side panels are slide-over drawers (use the *Expand Left Sidebar / Right Inspector* buttons); toolbars scroll sideways; layout respects notches and the on-screen keyboard.
- **Touch:** long-press (~0.2 s) a palette item or layer to drag it; the canvas captures touch gestures so the page doesn't scroll or zoom while you design.
- Respects *reduce motion*; larger tap targets on touch screens.

## Security

- Strict Content-Security-Policy (same-origin scripts only, no inline scripts, no `eval`), no-referrer, anti-framing guard. See `SECURITY.md`.
- No server and no accounts. Projects stay in your browser; only the Live preview tab sends the current `.slint` snippet to slintpad.com.
- Only third-party code: `vendor/mobile-drag-drop` (MIT), pinned by SHA-256 and verified on every deploy (`node scripts/build.mjs --check`).
- Netlify / Cloudflare Pages users get extra headers from `_headers` (HSTS, `frame-ancestors`, ...).

## Development

```
node scripts/build.mjs --check   # verify CSP, vendor hashes, icons, service-worker file list
node scripts/build.mjs           # verify + assemble _site/ (what the Pages workflow deploys)
npm i --no-save esbuild && node scripts/optimize.mjs app.js   # re-apply the bundle size optimisation after regenerating app.js
python3 -m http.server           # local test (service worker needs http://localhost, not file://)
```
New files must be added to `scripts/files.json` (and to `SHELL` in `sw.js` if they should work offline).

## Performance

- Scripts are `defer`red from `<head>` (downloads start immediately) and a splash screen shows until the app mounts.
- `app.js` has dev-only React warnings stripped (~7% smaller gzipped, renders identically). A real production build from the source project would shrink it much further.
- Offline cache is versioned per deploy; navigation preload and idle-time service-worker registration keep first load fast.
