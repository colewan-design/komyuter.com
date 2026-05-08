<script setup>
import { ref, onMounted, computed } from 'vue'
import { useJeepsStore } from '@/stores/jeeps'
import { useTripsStore } from '@/stores/trips'

const jeepsStore = useJeepsStore()
const tripsStore = useTripsStore()

const selectedJeepId = ref(null)
const showModal = ref(false)
const saving = ref(false)
const error = ref('')
const form = ref({ origin: '', destination: '' })

onMounted(async () => {
  await jeepsStore.fetchAll()
  if (jeepsStore.jeeps.length) {
    selectedJeepId.value = jeepsStore.jeeps[0].id
    await tripsStore.fetchForJeep(selectedJeepId.value)
  }
})

async function selectJeep(id) {
  selectedJeepId.value = id
  await tripsStore.fetchForJeep(id)
}

const selectedJeep = computed(() => jeepsStore.jeeps.find(j => j.id === selectedJeepId.value))

async function startTrip() {
  error.value = ''
  saving.value = true
  try {
    await tripsStore.start(selectedJeepId.value, form.value.origin, form.value.destination)
    showModal.value = false
    form.value = { origin: '', destination: '' }
  } catch (e) {
    error.value = e.response?.data?.message ?? 'Failed to start trip.'
  } finally {
    saving.value = false
  }
}

const statusColor = {
  ongoing:   'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
}

function fmt(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
}

function duration(trip) {
  if (!trip.started_at || !trip.ended_at) return '—'
  const ms = new Date(trip.ended_at) - new Date(trip.started_at)
  const mins = Math.round(ms / 60000)
  return mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h2 class="text-xl font-bold text-gray-900">Trip Management</h2>
        <p class="text-sm text-gray-500">Start, complete, and track trips per jeep</p>
      </div>
      <button v-if="selectedJeepId" @click="showModal = true"
        class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
        + Start Trip
      </button>
    </div>

    <div class="flex gap-4">
      <!-- Jeep list -->
      <div class="w-48 flex-shrink-0 space-y-1">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Jeeps</p>
        <button
          v-for="jeep in jeepsStore.jeeps" :key="jeep.id"
          @click="selectJeep(jeep.id)"
          :class="selectedJeepId === jeep.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'"
          class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition"
        >
          {{ jeep.name }}
        </button>
      </div>

      <!-- Trips table -->
      <div class="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100">
          <h3 class="font-semibold text-gray-800">{{ selectedJeep?.name ?? 'Select a jeep' }} — Trips</h3>
        </div>

        <div v-if="tripsStore.loading" class="p-8 text-center text-gray-400 text-sm">Loading trips...</div>
        <div v-else-if="!tripsStore.trips.length" class="p-8 text-center text-gray-400 text-sm">No trips recorded yet.</div>

        <table v-else class="w-full text-sm">
          <thead class="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
            <tr>
              <th class="px-5 py-3 text-left">Origin</th>
              <th class="px-5 py-3 text-left">Destination</th>
              <th class="px-5 py-3 text-left">Status</th>
              <th class="px-5 py-3 text-left">Started</th>
              <th class="px-5 py-3 text-left">Duration</th>
              <th class="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="trip in tripsStore.trips" :key="trip.id" class="hover:bg-gray-50">
              <td class="px-5 py-3 text-gray-800 font-medium">{{ trip.origin }}</td>
              <td class="px-5 py-3 text-gray-600">{{ trip.destination }}</td>
              <td class="px-5 py-3">
                <span :class="statusColor[trip.status]" class="px-2 py-0.5 rounded-full text-xs font-semibold capitalize">
                  {{ trip.status }}
                </span>
              </td>
              <td class="px-5 py-3 text-gray-500 text-xs">{{ fmt(trip.started_at) }}</td>
              <td class="px-5 py-3 text-gray-500 text-xs">{{ duration(trip) }}</td>
              <td class="px-5 py-3 text-right space-x-2">
                <button v-if="trip.status === 'ongoing'" @click="tripsStore.complete(trip.id)"
                  class="text-green-600 hover:underline text-xs font-medium">Complete</button>
                <button v-if="trip.status === 'ongoing'" @click="tripsStore.cancel(trip.id)"
                  class="text-red-500 hover:underline text-xs font-medium">Cancel</button>
                <button v-if="trip.status !== 'ongoing'" @click="tripsStore.remove(trip.id)"
                  class="text-gray-400 hover:text-red-400 hover:underline text-xs">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Start trip modal -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-5">Start New Trip</h3>
          <p class="text-sm text-gray-500 mb-4">Jeep: <span class="font-medium text-gray-800">{{ selectedJeep?.name }}</span></p>
          <form @submit.prevent="startTrip" class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Origin</label>
              <input v-model="form.origin" required class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Happy Hollow" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Destination</label>
              <input v-model="form.destination" required class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Session Road" />
            </div>
            <p v-if="error" class="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{{ error }}</p>
            <div class="flex gap-3 pt-2">
              <button type="button" @click="showModal = false"
                class="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition">Cancel</button>
              <button type="submit" :disabled="saving"
                class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold py-2 rounded-lg transition">
                {{ saving ? 'Starting...' : 'Start Trip' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
