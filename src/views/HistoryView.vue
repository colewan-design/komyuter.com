<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useJeepsStore } from '@/stores/jeeps'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

const jeepsStore = useJeepsStore()
const mapEl = ref(null)

let map = null
let startMarker = null
let endMarker = null
let playerMarker = null

const selectedJeepId = ref(null)
const from = ref('')
const to = ref('')
const loading = ref(false)
const locations = ref([])
const playIndex = ref(0)
let playTimer = null
const playing = ref(false)

function dotMarker(color) {
  const el = document.createElement('div')
  el.style.cssText = `width:18px;height:18px;border-radius:50%;background-color:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3)`
  return el
}

function clearRoute() {
  startMarker?.remove(); startMarker = null
  endMarker?.remove(); endMarker = null
  playerMarker?.remove(); playerMarker = null

  if (map.getLayer('route-line')) map.removeLayer('route-line')
  if (map.getSource('route')) map.removeSource('route')
}

onMounted(async () => {
  await jeepsStore.fetchAll()
  if (jeepsStore.jeeps.length) selectedJeepId.value = jeepsStore.jeeps[0].id

  map = new mapboxgl.Map({
    container: mapEl.value,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [120.5930, 16.4090],
    zoom: 14,
  })

  await new Promise(resolve => map.on('load', resolve))
})

onUnmounted(() => {
  stopPlayback()
  map?.remove()
})

async function fetchHistory() {
  if (!selectedJeepId.value) return
  loading.value = true
  stopPlayback()
  locations.value = []
  clearRoute()

  try {
    const params = { limit: 200 }
    if (from.value) params.from = from.value
    if (to.value) params.to = to.value

    const res = await jeepsStore.fetchHistory(selectedJeepId.value, params)
    locations.value = [...res.locations].reverse()

    if (!locations.value.length) return

    const coords = locations.value.map(l => [parseFloat(l.longitude), parseFloat(l.latitude)])

    map.addSource('route', {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'LineString', coordinates: coords } },
    })
    map.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      paint: { 'line-color': '#3b82f6', 'line-width': 3, 'line-opacity': 0.8 },
    })

    startMarker = new mapboxgl.Marker({ element: dotMarker('#22c55e') })
      .setLngLat(coords[0])
      .setPopup(new mapboxgl.Popup({ offset: 12, closeButton: false }).setHTML('<p style="font-size:12px;margin:0">Start</p>'))
      .addTo(map)

    endMarker = new mapboxgl.Marker({ element: dotMarker('#ef4444') })
      .setLngLat(coords[coords.length - 1])
      .setPopup(new mapboxgl.Popup({ offset: 12, closeButton: false }).setHTML('<p style="font-size:12px;margin:0">End</p>'))
      .addTo(map)

    const bounds = coords.reduce(
      (b, c) => b.extend(c),
      new mapboxgl.LngLatBounds(coords[0], coords[0])
    )
    map.fitBounds(bounds, { padding: 40 })
  } finally {
    loading.value = false
  }
}

function startPlayback() {
  if (!locations.value.length) return
  if (playIndex.value >= locations.value.length - 1) playIndex.value = 0
  playing.value = true

  playerMarker?.remove()
  const start = locations.value[playIndex.value]
  const startLngLat = [parseFloat(start.longitude), parseFloat(start.latitude)]

  const el = dotMarker('#3b82f6')
  el.style.width = '20px'
  el.style.height = '20px'
  el.style.zIndex = '10'

  playerMarker = new mapboxgl.Marker({ element: el })
    .setLngLat(startLngLat)
    .addTo(map)

  playTimer = setInterval(() => {
    playIndex.value++
    if (playIndex.value >= locations.value.length) {
      stopPlayback()
      return
    }
    const loc = locations.value[playIndex.value]
    const lngLat = [parseFloat(loc.longitude), parseFloat(loc.latitude)]
    playerMarker.setLngLat(lngLat)
    map.easeTo({ center: lngLat, duration: 400 })
  }, 500)
}

function stopPlayback() {
  clearInterval(playTimer)
  playing.value = false
}

function fmt(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('en-PH', { dateStyle: 'short', timeStyle: 'short' })
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <h2 class="text-xl font-bold text-gray-900">Location History</h2>
      <p class="text-sm text-gray-500">View and playback a jeep's route on the map</p>
    </div>

    <!-- Controls -->
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex flex-wrap items-end gap-4">
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">Jeep</label>
        <select v-model="selectedJeepId"
          class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option v-for="j in jeepsStore.jeeps" :key="j.id" :value="j.id">{{ j.name }}</option>
        </select>
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">From</label>
        <input v-model="from" type="datetime-local"
          class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">To</label>
        <input v-model="to" type="datetime-local"
          class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <button @click="fetchHistory" :disabled="loading"
        class="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
        {{ loading ? 'Loading…' : 'Load History' }}
      </button>

      <div v-if="locations.length" class="flex items-center gap-2 ml-auto">
        <span class="text-xs text-gray-500">{{ locations.length }} points</span>
        <button v-if="!playing" @click="startPlayback"
          class="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
          ▶ Play
        </button>
        <button v-else @click="stopPlayback"
          class="bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
          ⏸ Pause
        </button>
      </div>
    </div>

    <div class="flex gap-4">
      <!-- Map -->
      <div ref="mapEl"
        class="flex-1 rounded-xl overflow-hidden shadow border border-gray-200"
        style="height: calc(100vh - 280px); min-height: 400px">
      </div>

      <!-- Route log -->
      <div v-if="locations.length"
        class="w-56 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div class="px-4 py-3 border-b border-gray-100">
          <p class="text-xs font-semibold text-gray-700">Route Log</p>
        </div>
        <div class="overflow-y-auto flex-1">
          <div
            v-for="(loc, i) in locations" :key="loc.id"
            :class="i === playIndex ? 'bg-blue-50 border-l-2 border-blue-500' : 'hover:bg-gray-50'"
            class="px-4 py-2 text-xs border-b border-gray-50 transition-colors">
            <p class="text-gray-800 font-mono">
              {{ parseFloat(loc.latitude).toFixed(5) }}, {{ parseFloat(loc.longitude).toFixed(5) }}
            </p>
            <p class="text-gray-400 mt-0.5">{{ fmt(loc.recorded_at) }}</p>
            <p v-if="loc.speed" class="text-gray-400">{{ loc.speed }} km/h</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
