import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/api/axios'

export const useJeepneyRoutesStore = defineStore('jeepneyRoutes', () => {
  const routes = ref([])
  const loading = ref(false)

  async function fetchAll() {
    loading.value = true
    const { data } = await api.get('/jeepney-routes')
    routes.value = data
    loading.value = false
    return data
  }

  async function fetchOne(id) {
    const { data } = await api.get(`/jeepney-routes/${id}`)
    return data
  }

  return { routes, loading, fetchAll, fetchOne }
})
