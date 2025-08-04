import { createRouter, createWebHistory } from 'vue-router'
import { setupLayouts } from 'virtual:generated-layouts'
import { routes, handleHotUpdate } from 'vue-router/auto-routes'

export const router = createRouter({
  history: createWebHistory(),
  routes: setupLayouts(routes),
})

router.beforeEach(async (to, from) => {
  const authStore = useAuthStore()

  const publicRoutes = ['/', '/login']
  const is404 = to.matched[0].name === 'NotFound'
  if (publicRoutes.includes(to.path) || is404) {
    return true
  }

  // for non-public routes, check auth and apply login redirect
  await authStore.getPromise()
  console.log('authStore.user', authStore.user)
  if (!authStore.user) {
    authStore.loginRedirect = to
    return { path: '/login' }
  }
  return true
})

if (import.meta.hot) {
  handleHotUpdate(router)
}
