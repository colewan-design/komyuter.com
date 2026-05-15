import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/api/axios'

export const useDriversStore = defineStore('drivers', () => {
  const drivers = ref([])
  const loading = ref(false)

  async function fetchAll() {
    loading.value = true
    try {
      const { data } = await api.get('/drivers')
      drivers.value = data
    } finally {
      loading.value = false
    }
  }

  // Returns the plaintext token (shown once)
  async function generateToken(driverId) {
    const { data } = await api.post(`/drivers/${driverId}/token`)
    return data.token
  }

  return { drivers, loading, fetchAll, generateToken }
})
