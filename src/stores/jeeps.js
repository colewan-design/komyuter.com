import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/api/axios'

export const useJeepsStore = defineStore('jeeps', () => {
  const jeeps = ref([])
  const loading = ref(false)

  async function fetchAll() {
    loading.value = true
    const { data } = await api.get('/jeeps')
    jeeps.value = data
    loading.value = false
  }

  async function fetchOne(id) {
    const { data } = await api.get(`/jeeps/${id}`)
    return data
  }

  async function create(payload) {
    const { data } = await api.post('/jeeps', payload)
    jeeps.value.push(data.jeep)
    return data.jeep
  }

  async function update(id, payload) {
    const { data } = await api.put(`/jeeps/${id}`, payload)
    const idx = jeeps.value.findIndex((j) => j.id === id)
    if (idx !== -1) jeeps.value[idx] = data.jeep
    return data.jeep
  }

  async function remove(id) {
    await api.delete(`/jeeps/${id}`)
    jeeps.value = jeeps.value.filter((j) => j.id !== id)
  }

  async function fetchCurrentLocation(id) {
    const { data } = await api.get(`/jeeps/${id}/location`)
    return data
  }

  async function fetchHistory(id, params = {}) {
    const { data } = await api.get(`/jeeps/${id}/location/history`, { params })
    return data
  }

  return { jeeps, loading, fetchAll, fetchOne, create, update, remove, fetchCurrentLocation, fetchHistory }
})
