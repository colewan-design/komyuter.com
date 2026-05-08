<script setup>
import { ref, onMounted } from 'vue'
import { useJeepsStore } from '@/stores/jeeps'

const store = useJeepsStore()
onMounted(() => store.fetchAll())

const showModal = ref(false)
const saving = ref(false)
const deleting = ref(null)
const editingId = ref(null)
const error = ref('')

const blank = () => ({ name: '', plate_number: '', route_name: '', capacity: 20, status: 'active' })
const form = ref(blank())

const statusColor = {
  active:      'bg-green-100 text-green-700',
  inactive:    'bg-gray-100 text-gray-600',
  maintenance: 'bg-yellow-100 text-yellow-700',
}

function openCreate() {
  editingId.value = null
  form.value = blank()
  error.value = ''
  showModal.value = true
}

function openEdit(jeep) {
  editingId.value = jeep.id
  form.value = { name: jeep.name, plate_number: jeep.plate_number, route_name: jeep.route_name ?? '', capacity: jeep.capacity, status: jeep.status }
  error.value = ''
  showModal.value = true
}

async function save() {
  error.value = ''
  saving.value = true
  try {
    if (editingId.value) {
      await store.update(editingId.value, form.value)
    } else {
      await store.create(form.value)
    }
    showModal.value = false
  } catch (e) {
    const errs = e.response?.data?.errors
    error.value = errs ? Object.values(errs).flat().join(' ') : (e.response?.data?.message ?? 'Save failed.')
  } finally {
    saving.value = false
  }
}

async function remove(jeep) {
  if (!confirm(`Delete "${jeep.name}"? This cannot be undone.`)) return
  deleting.value = jeep.id
  await store.remove(jeep.id).finally(() => (deleting.value = null))
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-gray-900">Jeep Management</h2>
        <p class="text-sm text-gray-500">Add, edit or remove fleet vehicles</p>
      </div>
      <button @click="openCreate" class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
        + Add Jeep
      </button>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div v-if="store.loading" class="p-8 text-center text-gray-400 text-sm">Loading...</div>
      <div v-else-if="!store.jeeps.length" class="p-8 text-center text-gray-400 text-sm">No jeeps found. Add one to get started.</div>
      <table v-else class="w-full text-sm">
        <thead class="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
          <tr>
            <th class="px-6 py-3 text-left">Name</th>
            <th class="px-6 py-3 text-left">Plate</th>
            <th class="px-6 py-3 text-left">Route</th>
            <th class="px-6 py-3 text-left">Capacity</th>
            <th class="px-6 py-3 text-left">Status</th>
            <th class="px-6 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="jeep in store.jeeps" :key="jeep.id" class="hover:bg-gray-50">
            <td class="px-6 py-3 font-medium text-gray-900">{{ jeep.name }}</td>
            <td class="px-6 py-3 font-mono text-xs text-gray-600">{{ jeep.plate_number }}</td>
            <td class="px-6 py-3 text-gray-600">{{ jeep.route_name ?? '—' }}</td>
            <td class="px-6 py-3 text-gray-600">{{ jeep.capacity }}</td>
            <td class="px-6 py-3">
              <span :class="statusColor[jeep.status]" class="px-2 py-0.5 rounded-full text-xs font-semibold capitalize">
                {{ jeep.status }}
              </span>
            </td>
            <td class="px-6 py-3 text-right space-x-2">
              <button @click="openEdit(jeep)" class="text-blue-600 hover:underline text-xs font-medium">Edit</button>
              <button @click="remove(jeep)" :disabled="deleting === jeep.id"
                class="text-red-500 hover:underline text-xs font-medium disabled:opacity-50">
                {{ deleting === jeep.id ? '...' : 'Delete' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-5">{{ editingId ? 'Edit Jeep' : 'Add New Jeep' }}</h3>
          <form @submit.prevent="save" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Name</label>
                <input v-model="form.name" required class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Happy Hollow 01" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Plate Number</label>
                <input v-model="form.plate_number" required class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="BAG-1001" />
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Route</label>
              <input v-model="form.route_name" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Happy Hollow - Town" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Capacity</label>
                <input v-model.number="form.capacity" type="number" min="1" required class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select v-model="form.status" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            <p v-if="error" class="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{{ error }}</p>

            <div class="flex gap-3 pt-2">
              <button type="button" @click="showModal = false"
                class="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition">
                Cancel
              </button>
              <button type="submit" :disabled="saving"
                class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold py-2 rounded-lg transition">
                {{ saving ? 'Saving...' : (editingId ? 'Update' : 'Create') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
