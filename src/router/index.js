import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  { path: '/login',    name: 'Login',    component: () => import('@/views/auth/LoginView.vue'),    meta: { guest: true } },
  { path: '/register', name: 'Register', component: () => import('@/views/auth/RegisterView.vue'), meta: { guest: true } },
  {
    path: '/',
    component: () => import('@/components/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '',          name: 'Dashboard', component: () => import('@/views/DashboardView.vue') },
      { path: 'map',       name: 'Map',       component: () => import('@/views/MapView.vue') },
      { path: 'jeeps',     name: 'Jeeps',     component: () => import('@/views/JeepsView.vue') },
      { path: 'trips',     name: 'Trips',     component: () => import('@/views/TripsView.vue') },
      { path: 'history',   name: 'History',   component: () => import('@/views/HistoryView.vue') },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (auth.isLoggedIn && !auth.user) {
    await auth.fetchMe().catch(() => auth.logout())
  }

  if (to.meta.requiresAuth && !auth.isLoggedIn) return { name: 'Login' }
  if (to.meta.guest && auth.isLoggedIn) return { name: 'Dashboard' }
})

export default router
