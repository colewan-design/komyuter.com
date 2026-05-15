<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const sidebarOpen = ref(true)

const nav = [
  { name: 'Dashboard', to: '/',        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { name: 'Live Map',  to: '/map',      icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
  { name: 'Jeeps',     to: '/jeeps',    icon: 'M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2' },
  { name: 'Trips',     to: '/trips',    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { name: 'History',   to: '/history',  icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { name: 'Drivers',   to: '/drivers',  icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
]

async function logout() {
  await auth.logout()
  router.push('/login')
}

function isActive(to) {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}
</script>

<template>
  <div class="flex h-screen bg-gray-50 overflow-hidden">
    <!-- Sidebar -->
    <aside
      :class="sidebarOpen ? 'w-56' : 'w-16'"
      class="bg-gray-900 text-white flex flex-col transition-all duration-300 flex-shrink-0"
    >
      <!-- Logo -->
      <div class="flex items-center gap-3 px-4 py-5 border-b border-gray-700">
        <div class="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center font-bold text-sm flex-shrink-0">J</div>
        <span v-if="sidebarOpen" class="font-bold text-sm tracking-wide truncate">JeepTracker</span>
      </div>

      <!-- Nav -->
      <nav class="flex-1 py-4 space-y-1 px-2">
        <RouterLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          :class="[
            isActive(item.to)
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:bg-gray-800 hover:text-white',
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors'
          ]"
        >
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
          </svg>
          <span v-if="sidebarOpen" class="truncate">{{ item.name }}</span>
        </RouterLink>
      </nav>

      <!-- User -->
      <div class="border-t border-gray-700 px-3 py-4">
        <div v-if="sidebarOpen" class="flex items-center gap-3 mb-3">
          <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {{ auth.user?.name?.[0]?.toUpperCase() ?? 'U' }}
          </div>
          <div class="min-w-0">
            <p class="text-sm font-medium text-white truncate">{{ auth.user?.name }}</p>
            <p class="text-xs text-gray-400 capitalize">{{ auth.user?.role }}</p>
          </div>
        </div>
        <button
          @click="logout"
          :class="sidebarOpen ? 'w-full justify-start gap-3' : 'justify-center'"
          class="flex items-center text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg px-2 py-2 text-sm transition-colors w-full"
        >
          <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span v-if="sidebarOpen">Logout</span>
        </button>
      </div>
    </aside>

    <!-- Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Topbar -->
      <header class="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
        <button @click="sidebarOpen = !sidebarOpen" class="text-gray-500 hover:text-gray-700">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 class="text-base font-semibold text-gray-800">
          {{ nav.find(n => isActive(n.to))?.name ?? 'JeepTracker' }}
        </h1>
      </header>

      <main class="flex-1 overflow-auto p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>
