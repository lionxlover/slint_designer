/*
 * Slint Designer — enhance.js
 * Classic script, no dependencies, loaded BEFORE app.js (see index.html).
 * Adds: embed guard, phone/tablet first-run layout, touch drag & drop,
 * and offline support (service worker) — without touching the app bundle.
 */
(function () {
  'use strict';

  var ALLOW_EMBED = false;              // set true if you want to allow <iframe> embedding of the designer
  var LAYOUT_KEY = 'slint-designer-layout-prefs-v1'; // same key app.js uses
  var win = window, doc = document;

  /* 1. Anti-clickjacking. GitHub Pages cannot send X-Frame-Options / frame-ancestors,
        so refuse to render when framed. */
  if (!ALLOW_EMBED && win.top !== win.self) {
    doc.documentElement.style.display = 'none';
    try { win.top.location.replace(win.location.href); } catch (e) { /* sandboxed/cross-origin: stay hidden */ }
    return;
  }

  /* 2. First run on phones / portrait tablets: start with both side panels collapsed
        (the app shows its own "Expand Left Sidebar / Right Inspector" buttons).
        Existing saved preferences are never overwritten. */
  try {
    var narrow = win.matchMedia && win.matchMedia('(max-width: 1023.98px)').matches;
    if (narrow && win.localStorage && win.localStorage.getItem(LAYOUT_KEY) === null) {
      win.localStorage.setItem(LAYOUT_KEY, JSON.stringify({
        leftPanelSize: 20, rightPanelSize: 25,
        leftCollapsed: true, rightCollapsed: true,
        optionsBarVisible: true, canvasTheme: 'dark-grid', layoutPreset: 'default'
      }));
    }
  } catch (e) { /* storage blocked: app falls back to defaults */ }

  /* 3. Touch drag & drop. The app uses HTML5 DnD (palette -> canvas, layer reordering),
        which most touch browsers don't fire. Long-press (220 ms) starts a drag so
        normal scrolling in the panels still works. */
  try {
    var M = win.MobileDragDrop;
    if (M && typeof M.polyfill === 'function') {
      var cfg = { holdToDrag: 220 };
      if (typeof M.scrollBehaviourDragImageTranslateOverride === 'function') {
        cfg.dragImageTranslateOverride = M.scrollBehaviourDragImageTranslateOverride;
      }
      M.polyfill(cfg);
      // iOS Safari: lets the polyfill call preventDefault() on touchmove
      win.addEventListener('touchmove', function () {}, { passive: false });
    }
  } catch (e) { /* never block the app on an enhancement */ }

  /* 4. Offline / installable. Only on https or localhost (service workers don't exist on file://). */
  var secure = win.location.protocol === 'https:' ||
    win.location.hostname === 'localhost' || win.location.hostname === '127.0.0.1';
  if ('serviceWorker' in navigator && secure) {
    // register when the browser is idle so it never competes with first render
    win.addEventListener('load', function () {
      var go = function () { navigator.serviceWorker.register('sw.js', { scope: './' }).catch(function () {}); };
      if (win.requestIdleCallback) win.requestIdleCallback(go, { timeout: 4000 }); else win.setTimeout(go, 1500);
    });
  }
})();
