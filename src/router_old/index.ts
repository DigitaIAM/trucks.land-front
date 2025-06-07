import { createRouter, createWebHistory } from 'vue-router'
import OrderView from '../components/order/OrderFullView.vue'
import LoginPage from '@/views/LoginPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
    },
    {
      path: '/',
      name: 'home',
      component: OrderView,
    },
    {
      path: '/orders',
      name: 'orders',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('@/pages/app/order/all.vue'),
    },
    {
      path: '/dispatcher',
      name: 'dispatcher',
      component: () => import('@/pages/app/journals/dispatcherView.vue'),
    },
    {
      path: '/tracking',
      name: 'tracking',
      component: () => import('@/pages/app/journals/trackingView.vue'),
    },
    {
      path: '/checkout',
      name: 'checkout',
      component: () => import('@/pages/app/journals/check-outView.vue'),
    },
    {
      path: '/income',
      name: 'income',
      component: () => import('@/pages/app/journals/incomeView.vue'),
    },
    {
      path: '/quickpay',
      name: 'quickpay',
      component: () => import('@/pages/app/journals/quick_payView.vue'),
    },
    {
      path: '/reference',
      name: 'reference',
      component: () => import('@/pages/app/referenceBooks.vue'),
    },
    {
      path: '/reports',
      name: 'reports',
      component: () => import('@/pages/app/reportsView.vue'),
    },
    {
      path: '/brokers',
      name: 'brokers',
      component: () => import('../views/referenceBooks/Brokers.vue'),
    },
    {
      path: '/drivers',
      name: 'drivers',
      component: () => import('../views/referenceBooks/Drivers.vue'),
    },
    {
      path: '/vehicles',
      name: 'vehicles',
      component: () => import('../views/referenceBooks/Vehicles.vue'),
    },
    {
      path: '/owners',
      name: 'owners',
      component: () => import('../views/referenceBooks/Owners.vue'),
    },
    {
      path: '/users',
      name: 'users',
      component: () => import('../views/referenceBooks/Users.vue'),
    },
    {
      path: '/statuses',
      name: 'statuses',
      component: () => import('../views/referenceBooks/Statuses.vue'),
    },
    {
      path: '/finances',
      name: 'finances',
      component: () => import('@/pages/app/financesView.vue'),
    },
  ],
})

export default router
