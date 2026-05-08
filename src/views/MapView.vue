<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'
import PusherModule from 'pusher-js'
const PusherClass = PusherModule.Pusher ?? PusherModule
import { useJeepsStore } from '@/stores/jeeps'

const GMAPS_KEY = 'AIzaSyCsiDYzoVEx6oSReXcY93EZMBSZizMT_KE'

const jeepsStore = useJeepsStore()
const mapEl = ref(null)
const liveEvents = ref(0)

let map = null
const markerMap = {}     // jeepId → { marker, infoWindow, jeep }
const pusherChannels = {}
let pusher = null

const statusColor = {
  active: '#22c55e',
  inactive: '#9ca3af',
  maintenance: '#eab308',
}

function markerIcon(status) {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 14,
    fillColor: statusColor[status] ?? '#6b7280',
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2.5,
  }
}

function infoContent(jeep, loc) {
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
  const pos = { lat: parseFloat(loc.latitude), lng: parseFloat(loc.longitude) }
  if (markerMap[jeep.id]) {
    markerMap[jeep.id].marker.setPosition(pos)
    markerMap[jeep.id].marker.setIcon(markerIcon(jeep.status))
    markerMap[jeep.id].infoWindow.setContent(infoContent(jeep, loc))
    markerMap[jeep.id].jeep = jeep
  } else {
    const marker = new google.maps.Marker({
      map,
      position: pos,
      icon: markerIcon(jeep.status),
      title: jeep.name,
    })
    const infoWindow = new google.maps.InfoWindow({ content: infoContent(jeep, loc) })
    marker.addListener('click', () => {
      Object.values(markerMap).forEach(m => m.infoWindow.close())
      infoWindow.open(map, marker)
    })
    markerMap[jeep.id] = { marker, infoWindow, jeep }
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
    markerMap[jeep.id].marker.setIcon(markerIcon(status))
  })

  pusherChannels[jeep.id] = ch
}

onMounted(async () => {
  setOptions({ apiKey: GMAPS_KEY, version: 'weekly' })
  await importLibrary('maps')

  map = new google.maps.Map(mapEl.value, {
    center: { lat: 16.4090, lng: 120.5930 },
    zoom: 14,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
  })

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