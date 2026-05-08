# Fix — Favicon & Site Icons Updated
**Date:** 2026-05-08

## What Changed
Replaced the default Vite SVG favicon with a proper multi-format favicon set from `favicon_io`.

## What Changed
| File | Change |
|------|--------|
| [public/favicon.ico](../public/favicon.ico) | Added — main browser tab icon |
| [public/favicon-16x16.png](../public/favicon-16x16.png) | Added |
| [public/favicon-32x32.png](../public/favicon-32x32.png) | Added |
| [public/apple-touch-icon.png](../public/apple-touch-icon.png) | Added — iOS home screen icon |
| [public/android-chrome-192x192.png](../public/android-chrome-192x192.png) | Added — Android PWA icon |
| [public/android-chrome-512x512.png](../public/android-chrome-512x512.png) | Added — Android PWA icon (large) |
| [public/site.webmanifest](../public/site.webmanifest) | Added + filled in name: "Jeep Tracker" |
| [index.html](../index.html) | Updated `<head>` — removed old SVG favicon, added all icon link tags + manifest link, updated title to "Jeep Tracker" |

## How to Test
1. Run `npm run dev` and open the app in your browser.
2. Check the browser tab — should show the new favicon instead of the Vite logo.
3. On Chrome: open DevTools → Application → Manifest — should show "Jeep Tracker" with both Android icons.
4. On iOS (Safari): use "Add to Home Screen" — should use the apple-touch-icon.
5. Hard refresh (`Ctrl+Shift+R`) if the old favicon is still cached.

## Watch Out For
Old favicon might be cached by the browser. A hard refresh or clearing browser cache will force the new one to load.
