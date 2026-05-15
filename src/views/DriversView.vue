<script setup>
import { ref, onMounted } from 'vue'
import { useDriversStore } from '@/stores/drivers'

const store = useDriversStore()
onMounted(() => store.fetchAll())

// token state: { [driverId]: string }
const tokens = ref({})
const generating = ref(null)
const copied = ref(null)

async function generate(driver) {
  generating.value = driver.id
  try {
    const token = await store.generateToken(driver.id)
    tokens.value = { ...tokens.value, [driver.id]: token }
  } catch (e) {
    alert(e.response?.data?.message ?? 'Failed to generate code.')
  } finally {
    generating.value = null
  }
}

async function copy(driverId) {
  const token = tokens.value[driverId]
  if (!token) return
  await navigator.clipboard.writeText(token)
  copied.value = driverId
  setTimeout(() => { if (copied.value === driverId) copied.value = null }, 2000)
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <h2 class="text-xl font-bold text-gray-900">Driver Access Codes</h2>
      <p class="text-sm text-gray-500 mt-0.5">
        Generate a one-tap login code for each driver. Share it once — they paste it in the mobile app under <strong>Drive (No Account)</strong>.
      </p>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div v-if="store.loading" class="p-8 text-center text-gray-400 text-sm">Loading drivers…</div>
      <div v-else-if="!store.drivers.length" class="p-8 text-center text-gray-400 text-sm">
        No driver accounts found. Register a user with <code class="bg-gray-100 px-1 rounded">role=driver</code> first.
      </div>
      <table v-else class="w-full text-sm">
        <thead class="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
          <tr>
            <th class="px-6 py-3 text-left">Driver</th>
            <th class="px-6 py-3 text-left">Email</th>
            <th class="px-6 py-3 text-left">Jeeps</th>
            <th class="px-6 py-3 text-left">Access Code</th>
            <th class="px-6 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="driver in store.drivers" :key="driver.id" class="hover:bg-gray-50">
            <td class="px-6 py-3 font-medium text-gray-900">{{ driver.name }}</td>
            <td class="px-6 py-3 text-gray-500">{{ driver.email }}</td>
            <td class="px-6 py-3 text-gray-500">{{ driver.jeeps_count }}</td>

            <!-- Code column -->
            <td class="px-6 py-3">
              <div v-if="tokens[driver.id]" class="flex items-center gap-2">
                <code class="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded px-2 py-1 font-mono truncate max-w-[220px]">
                  {{ tokens[driver.id] }}
                </code>
                <button
                  @click="copy(driver.id)"
                  class="text-xs font-medium transition"
                  :class="copied === driver.id ? 'text-green-600' : 'text-blue-600 hover:text-blue-800'">
                  {{ copied === driver.id ? '✓ Copied' : 'Copy' }}
                </button>
              </div>
              <span v-else class="text-gray-400 text-xs italic">Not generated yet</span>
            </td>

            <!-- Generate button -->
            <td class="px-6 py-3 text-right">
              <button
                @click="generate(driver)"
                :disabled="generating === driver.id"
                class="text-xs font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                :class="tokens[driver.id]
                  ? 'bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700'">
                {{ generating === driver.id ? '…' : tokens[driver.id] ? 'Regenerate' : 'Generate Code' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="text-xs text-gray-400">
      Generating a new code invalidates the driver's previous code and any active login session.
    </p>
  </div>
</template>
