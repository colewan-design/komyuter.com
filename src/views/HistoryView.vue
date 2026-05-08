<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Loader } from '@googlemaps/js-api-loader'
import { useJeepsStore } from '@/stores/jeeps'

const GMAPS_KEY = 'AIzaSyCsiDYzoVEx6oSReXcY93EZMBSZizMT_KE'

const jeepsStore = useJeepsStore()
const mapEl = ref(null)

let map = null
let polyline = null
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

onMounted(async () => {
  await jeepsStore.fetchAll()
  if (jeepsStore.jeeps.length) selectedJeepId.value = jeepsStore.jeeps[0].id

  const loader = new Loader({ apiKey: GMAPS_KEY, version: 'weekly' })
  await loader.load()

  map = new google.maps.Map(mapEl.value, {
    center: { lat: 16.4090, lng: 120.5930 },
    zoom: 14,
    mapTypeControl: false,
    streetViewControl: false,
  })
})

onUnmounted(() => stopPlayback())

async function fetchHistory() {
  if (!selectedJeepId.value) return
  loading.value = true
  stopPlayback()
  locations.value = []

  polyline?.setMap(null)
  startMarker?.setMap(null)
  endMarker?.setMap(null)
  playerMarker?.setMap(null)
  polyline = startMarker = endMarker = playerMarker = null

  try {
    const params = { limit: 200 }
    if (from.value) params.from = from.value
    if (to.value) params.to = to.value

    const res = await jeepsStore.fetchHistory(selectedJeepId.value, params)
    locations.value = [...res.locations].reverse()

    if (!locations.value.length) return

    const path = locations.value.map(l => ({
      lat: parseFloat(l.latitude),
      lng: parseFloat(l.longitude),
    }))

    polyline = new google.maps.Polyline({
      path,
      map,
      strokeColor: '#3b82f6',
      strokeWeight: 3,
      strokeOpacity: 0.8,
    })

    const dotIcon = (color) => ({
      path: google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
    })

    startMarker = new google.maps.Marker({ map, position: path[0], icon: dotIcon('#22c55e'), title: 'Start' })
    endMarker = new google.maps.Marker({ map, position: path[path.length - 1], icon: dotIcon('#ef4444'), title: 'End' })

    const bounds = new google.maps.LatLngBounds()
    path.forEach(p => bounds.extend(p))
    map.fitBounds(bounds, 40)
  } finally {
    loading.value = false
  }
}

function startPlayback() {
  if (!locations.value.length) return
  if (playIndex.value >= locations.value.length - 1) playIndex.value = 0
  playing.value = true

  playerMarker?.setMap(null)
  const start = locations.value[playIndex.value]
  playerMarker = new google.maps.Marker({
    map,
    position: { lat: parseFloat(start.latitude), lng: parseFloat(start.longitude) },
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: '#3b82f6',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
    },
    zIndex: 10,
  })

  playTimer = setInterval(() => {
    playIndex.value++
    if (playIndex.value >= locations.value.length) {
      stopPlayback()
      return
    }
    const loc = locations.value[playIndex.value]
    const pos = { lat: parseFloat(loc.latitude), lng: parseFloat(loc.longitude) }
    playerMarker.setPosition(pos)
    map.panTo(pos)
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