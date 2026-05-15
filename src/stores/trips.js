import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/api/axios'

export const useTripsStore = defineStore('trips', () => {
  const trips = ref([])
  const loading = ref(false)

  async function fetchForJeep(jeepId) {
    loading.value = true
    const { data } = await api.get(`/jeeps/${jeepId}/trips`)
    trips.value = data
    loading.value = false
    return data
  }

  async function start(jeepId, origin, destination, jeepneyRouteId = null) {
    const payload = { origin, destination }
    if (jeepneyRouteId) payload.jeepney_route_id = jeepneyRouteId
    const { data } = await api.post(`/jeeps/${jeepId}/trips`, payload)
    trips.value.unshift(data.trip)
    return data.trip
  }

  async function updateTrip(tripId, payload) {
    const { data } = await api.put(`/trips/${tripId}`, payload)
    const idx = trips.value.findIndex((t) => t.id === tripId)
    if (idx !== -1) trips.value[idx] = data.trip
    return data.trip
  }

  async function setStatus(tripId, status) {
    return updateTrip(tripId, { status })
  }

  async function complete(tripId) {
    return updateTrip(tripId, { status: 'completed' })
  }

  async function cancel(tripId) {
    return updateTrip(tripId, { status: 'cancelled' })
  }

  async function remove(tripId) {
    await api.delete(`/trips/${tripId}`)
    trips.value = trips.value.filter((t) => t.id !== tripId)
  }

  return { trips, loading, fetchForJeep, start, updateTrip, setStatus, complete, cancel, remove }
})
