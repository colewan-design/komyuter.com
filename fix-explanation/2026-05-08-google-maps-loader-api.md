# Fix — Google Maps Loader API Removed
**Date:** 2026-05-08

## What Was Broken
The Live Map page threw this error on load and the map never appeared:

```
Uncaught (in promise) Error: [@googlemaps/js-api-loader]: The Loader class is no longer
available in this version. Please use the new functional API: setOptions() and importLibrary().
```

## Root Cause
The `@googlemaps/js-api-loader` package was updated and removed the old `Loader` class entirely. The old usage was:
```js
const loader = new Loader({ apiKey: GMAPS_KEY, version: 'weekly' })
await loader.load()
```

## What Changed
| File | Change |
|------|--------|
| [src/views/MapView.vue](../src/views/MapView.vue) | Replaced `import { Loader }` with `import { setOptions, importLibrary }` |
| [src/views/MapView.vue:94-95](../src/views/MapView.vue) | Replaced `new Loader(...).load()` with `setOptions(...)` + `await importLibrary('maps')` |

New code in `onMounted`:
```js
setOptions({ apiKey: GMAPS_KEY, version: 'weekly' })
await importLibrary('maps')
```

The rest of the file (all `google.maps.*` references) was left untouched — the global namespace is still populated after `importLibrary` runs.

## How to Test
1. Open the app and navigate to the **Live Map** page.
2. The map should render centered on Baguio (16.4090, 120.5930) with no console errors.
3. Jeep markers with location data should appear on the map.
4. Click a marker — the info popup should show name, plate, status, and coordinates.
5. Check the browser console — no `[@googlemaps/js-api-loader]` error should appear.

## Watch Out For
None expected — this is a drop-in replacement. The `google.maps` global is still available exactly as before after `importLibrary('maps')` resolves.
