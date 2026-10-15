/* Slint Designer service worker — offline app shell.
 * BUILD is replaced with a content hash by scripts/build.mjs on deploy, so every release
 * gets a fresh cache and old ones are purged. Cross-origin requests (slintpad.com live
 * preview) are never touched. */
const BUILD = 'dev';
const CACHE = 'slint-designer-' + BUILD;
const SHELL = [
  './', 'index.html', 'app.js', 'styles.css', 'enhance.js', 'enhance.css', 'manifest.webmanifest',
  'assets/icon.svg', 'assets/icon-192.png', 'assets/icon-512.png', 'assets/apple-touch-icon.png',
  'vendor/mobile-drag-drop/index.min.js', 'vendor/mobile-drag-drop/scroll-behaviour.min.js',
  'vendor/mobile-drag-drop/default.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // one by one: a single missing file must not abort the whole install
    await Promise.all(SHELL.map((u) => cache.add(new Request(u, { cache: 'reload' })).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('slint-designer-') && k !== CACHE).map((k) => caches.delete(k)));
    if (self.registration.navigationPreload) await self.registration.navigationPreload.enable().catch(() => {});
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {            // network first, cached shell when offline
    event.respondWith((async () => {
      try {
        const res = (await event.preloadResponse) || (await fetch(req, { cache: 'no-cache' }));
        if (res.ok) (await caches.open(CACHE)).put('index.html', res.clone());
        return res;
      } catch {
        return (await caches.match('index.html')) || (await caches.match('./')) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {          // assets: cache first, refresh in background
    const hit = await caches.match(req);
    const refresh = fetch(req, { cache: 'no-cache' }).then(async (res) => {
      if (res.ok && res.type === 'basic') (await caches.open(CACHE)).put(req, res.clone());
      return res;
    }).catch(() => hit);
    return hit || refresh;
  })());
});
