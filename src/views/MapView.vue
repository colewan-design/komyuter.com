<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import PusherModule from 'pusher-js'
const PusherClass = PusherModule.Pusher ?? PusherModule
import { useJeepsStore } from '@/stores/jeeps'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

const jeepsStore = useJeepsStore()
const mapEl = ref(null)
const liveEvents = ref(0)

let map = null
const markerMap = {}     // jeepId → { marker, popup, el, jeep }
const pusherChannels = {}
let pusher = null

const statusColor = {
  active: '#22c55e',
  inactive: '#9ca3af',
  maintenance: '#eab308',
}

function markerEl(status) {
  const el = document.createElement('div')
  el.style.cssText = `width:28px;height:28px;border-radius:50%;background-color:${statusColor[status] ?? '#6b7280'};border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);cursor:pointer`
  return el
}

function popupHTML(jeep, loc) {
  const color = statusColor[jeep.status] ?? '#6b7280'
  return `
    <div style="font-family:sans-serif;min-width:170px;padding:2px 0">
      <p style="font-weight:700;font-size:14px;margin:0 0 4px">${jeep.name}</p>
      <p style="font-size:12px;color:#6b7280;margin:0 0 2px">${jeep.plate_number}${jeep.route_name ? ' · ' + jeep.route_name : ''}</p>
      <p style="font-size:12px;margin:0 0 6px">Status: <b style="color:${color}">${jeep.status}</b></p>
      ${loc
        ? `<p style="font-size:11px;color:#9ca3af;margin:0">${parseFloat(loc.latitude).toFixed(5)}, ${parseFloat(loc.longitude).toFixed(5)}</p>
           <p style="font-size:11px;color:#9ca3af;margin:2px 0 0">Speed: ${loc.speed != null ? loc.speed + ' km/h' : '—'}</p>`
        : '<p style="font-size:11px;color:#d1d5db;margin:0">No location data yet</p>'}
    </div>`
}

function placeOrUpdateMarker(jeep, loc) {
  const lngLat = [parseFloat(loc.longitude), parseFloat(loc.latitude)]

  if (markerMap[jeep.id]) {
    const { marker, popup, el } = markerMap[jeep.id]
    marker.setLngLat(lngLat)
    el.style.backgroundColor = statusColor[jeep.status] ?? '#6b7280'
    popup.setHTML(popupHTML(jeep, loc))
    markerMap[jeep.id].jeep = jeep
  } else {
    const el = markerEl(jeep.status)
    const popup = new mapboxgl.Popup({ offset: 16, closeButton: false })
      .setHTML(popupHTML(jeep, loc))

    const marker = new mapboxgl.Marker({ element: el })
      .setLngLat(lngLat)
      .setPopup(popup)
      .addTo(map)

    el.addEventListener('click', () => {
      Object.values(markerMap).forEach(m => {
        if (m.marker !== marker) m.popup.remove()
      })
    })

    markerMap[jeep.id] = { marker, popup, el, jeep }
  }
}

function subscribeToJeep(jeep) {
  const ch = pusher.subscribe(`jeep.${jeep.id}`)

  ch.bind('location.updated', ({ location }) => {
    if (!location?.latitude) return
    const current = { ...(markerMap[jeep.id]?.jeep ?? jeep), status: 'active' }
    placeOrUpdateMarker(current, location)
    liveEvents.value++
  })

  ch.bind('status.changed', ({ status }) => {
    if (!markerMap[jeep.id]) return
    const current = { ...markerMap[jeep.id].jeep, status }
    markerMap[jeep.id].jeep = current
    markerMap[jeep.id].el.style.backgroundColor = statusColor[status] ?? '#6b7280'
  })

  pusherChannels[jeep.id] = ch
}

onMounted(async () => {
  map = new mapboxgl.Map({
    container: mapEl.value,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [120.5930, 16.4090],
    zoom: 14,
  })

  await new Promise(resolve => map.on('load', resolve))

  pusher = new PusherClass('0f12289adb56149777a9', { cluster: 'ap1' })

  await jeepsStore.fetchAll()
  jeepsStore.jeeps.forEach(jeep => {
    if (jeep.latest_location) placeOrUpdateMarker(jeep, jeep.latest_location)
    subscribeToJeep(jeep)
  })
})

onUnmounted(() => {
  Object.values(pusherChannels).forEach(ch => ch.unbind_all())
  pusher?.disconnect()
  map?.remove()
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-gray-900">Live Map</h2>
        <p class="text-sm text-gray-500">
          Real-time via WebSocket
          <span v-if="liveEvents > 0" class="ml-2 inline-flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block"></span>
            {{ liveEvents }} update{{ liveEvents !== 1 ? 's' : '' }}
          </span>
        </p>
      </div>
      <div class="flex items-center gap-4 text-xs text-gray-600">
        <span class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded-full bg-green-500 inline-block"></span>Active
        </span>
        <span class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded-full bg-gray-400 inline-block"></span>Inactive
        </span>
        <span class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded-full bg-yellow-400 inline-block"></span>Maintenance
        </span>
      </div>
    </div>

    <div
      ref="mapEl"
      class="w-full rounded-xl overflow-hidden shadow border border-gray-200"
      style="height: calc(100vh - 200px)"
    ></div>
  </div>
</template>
