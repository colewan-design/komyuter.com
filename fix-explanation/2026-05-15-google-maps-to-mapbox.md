# Fix — Google Maps replaced with Mapbox GL JS
**Date:** 2026-05-15

## What Was Broken
The app was using Google Maps (via `@googlemaps/js-api-loader`) in both the Live Map and Location History pages. After removing that package, the build failed because both `MapView.vue` and `HistoryView.vue` still imported from `@googlemaps/js-api-loader`.

## Root Cause
Two views depended on the Google Maps JS API loader:
- `MapView.vue` used `setOptions` / `importLibrary` from `@googlemaps/js-api-loader`
- `HistoryView.vue` used the `Loader` class from the same package, plus had a hardcoded Google Maps API key baked directly into the source file

## What Changed
| File | Change |
|------|--------|
| `.env` | Replaced `VITE_GMAPS_KEY` and `VITE_GMAPS_MAP_ID` with `VITE_MAPBOX_TOKEN` |
| `package.json` | Removed `@googlemaps/js-api-loader` and `@types/google.maps`; added `mapbox-gl` |
| `src/views/MapView.vue` | Full rewrite — uses `mapboxgl.Map`, `mapboxgl.Marker`, `mapboxgl.Popup` instead of Google Maps equivalents |
| `src/views/HistoryView.vue` | Full rewrite — same switch to Mapbox; route polyline now uses a GeoJSON source + line layer; bounds fitting uses `mapboxgl.LngLatBounds`; playback marker uses `marker.setLngLat()` + `map.easeTo()` |

## How to Test

### Live Map (`/map`)
1. Open the app and go to the Live Map page.
2. The map should load centered on Baguio (approx 16.409°N, 120.593°E) using a Mapbox Streets style.
3. Any jeeps with a `latest_location` should appear as colored dots (green = active, gray = inactive, yellow = maintenance).
4. Click a dot — a popup should appear with the jeep name, plate, route, coordinates, and speed.
5. If a jeep sends a live location update via Pusher, its dot should move and the update counter in the header should increment.

### Location History (`/history`)
1. Go to Location History.
2. Select a jeep, optionally set From/To date range, click "Load History".
3. A blue polyline should appear on the map showing the route.
4. A green dot marks the start, a red dot marks the end.
5. The map should auto-fit to show the full route.
6. Click "▶ Play" — a blue dot should animate along the route, and the map should follow it.
7. Click "⏸ Pause" to stop. The route log on the right should highlight the current position.

## Watch Out For
- **Secret token in `.env`** — the Mapbox token currently starts with `sk.` (secret token). These are meant for server-side use. Before going to production, replace it with a public token (`pk.`) from the Mapbox account dashboard. Secret tokens in frontend bundles are visible to anyone who inspects the network requests.
- **Coordinate order flip** — Mapbox uses `[longitude, latitude]` (lon first), while Google Maps used `{lat, lng}`. All coordinate calls have been updated, but if new map code is added later, be careful about the order.
- **Map CSS** — Mapbox requires its own stylesheet (`mapbox-gl/dist/mapbox-gl.css`) imported in each view that uses a map. If the map container looks unstyled or controls are missing, check that the import is present.
