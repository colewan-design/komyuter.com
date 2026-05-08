<script setup>
import { onMounted, computed } from 'vue'
import { useJeepsStore } from '@/stores/jeeps'
import { useAuthStore } from '@/stores/auth'

const jeepsStore = useJeepsStore()
const auth = useAuthStore()

onMounted(() => jeepsStore.fetchAll())

const total     = computed(() => jeepsStore.jeeps.length)
const active    = computed(() => jeepsStore.jeeps.filter(j => j.status === 'active').length)
const inactive  = computed(() => jeepsStore.jeeps.filter(j => j.status === 'inactive').length)
const maintenance = computed(() => jeepsStore.jeeps.filter(j => j.status === 'maintenance').length)

const statusColor = {
  active:      'bg-green-100 text-green-700',
  inactive:    'bg-gray-100 text-gray-600',
  maintenance: 'bg-yellow-100 text-yellow-700',
}
</script>

<template>
  <div class="space-y-6">
    <!-- Welcome -->
    <div>
      <h2 class="text-2xl font-bold text-gray-900">Good day, {{ auth.user?.name }} 👋</h2>
      <p class="text-sm text-gray-500 mt-1">Here's your fleet overview.</p>
    </div>

    <!-- Stat cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <p class="text-sm text-gray-500 font-medium">Total Jeeps</p>
        <p class="text-3xl font-bold text-gray-900 mt-1">{{ total }}</p>
      </div>
      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <p class="text-sm text-green-600 font-medium">Active</p>
        <p class="text-3xl font-bold text-green-600 mt-1">{{ active }}</p>
      </div>
      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <p class="text-sm text-gray-500 font-medium">Inactive</p>
        <p class="text-3xl font-bold text-gray-400 mt-1">{{ inactive }}</p>
      </div>
      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <p class="text-sm text-yellow-600 font-medium">Maintenance</p>
        <p class="text-3xl font-bold text-yellow-500 mt-1">{{ maintenance }}</p>
      </div>
    </div>

    <!-- Jeep table -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 class="font-semibold text-gray-800">Fleet Status</h3>
        <RouterLink to="/jeeps" class="text-sm text-blue-600 hover:underline">Manage jeeps →</RouterLink>
      </div>

      <div v-if="jeepsStore.loading" class="p-8 text-center text-gray-400 text-sm">Loading fleet data...</div>

      <div v-else-if="!jeepsStore.jeeps.length" class="p-8 text-center text-gray-400 text-sm">No jeeps found.</div>

      <table v-else class="w-full text-sm">
        <thead class="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
          <tr>
            <th class="px-6 py-3 text-left">Name</th>
            <th class="px-6 py-3 text-left">Plate</th>
            <th class="px-6 py-3 text-left">Route</th>
            <th class="px-6 py-3 text-left">Capacity</th>
            <th class="px-6 py-3 text-left">Status</th>
            <th class="px-6 py-3 text-left">Last Location</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="jeep in jeepsStore.jeeps" :key="jeep.id" class="hover:bg-gray-50">
            <td class="px-6 py-3 font-medium text-gray-900">{{ jeep.name }}</td>
            <td class="px-6 py-3 text-gray-600 font-mono text-xs">{{ jeep.plate_number }}</td>
            <td class="px-6 py-3 text-gray-600">{{ jeep.route_name ?? '—' }}</td>
            <td class="px-6 py-3 text-gray-600">{{ jeep.capacity }}</td>
            <td class="px-6 py-3">
              <span :class="statusColor[jeep.status]" class="px-2 py-0.5 rounded-full text-xs font-semibold capitalize">
                {{ jeep.status }}
              </span>
            </td>
            <td class="px-6 py-3 text-gray-500 text-xs">
              <span v-if="jeep.latest_location">
                {{ jeep.latest_location.latitude.toFixed(4) }}, {{ jeep.latest_location.longitude.toFixed(4) }}
              </span>
              <span v-else class="text-gray-300">No data</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
