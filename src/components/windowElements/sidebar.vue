<script setup lang="ts">
const router = useRouter()
const route = useRoute()

const links = [
  { name: 'Orders', path: '/app/nav/orders' },
  { name: 'Dispatcher', path: '/app/nav/dispatcher' },
  { name: 'Tracking', path: '/app/nav/tracking' },
  { name: 'Check out', path: '/app/nav/check-out' },
  { name: 'Income', path: '/app/nav/income' },
  { name: 'Quick pay', path: '/app/nav/quick_pay' },
  { name: 'Reference books', path: '/app/nav/referenceBooks' },
  { name: 'Reports', path: '/app/nav/reports' },
  { name: 'Finances', path: '/app/nav/finances' },
]
</script>

<template>
  <div class="dropdown">
    <div tabindex="0" role="button" class="btn btn-ghost btn-circle">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 6h16M4 12h16M4 18h7"
        />
      </svg>
    </div>
    <ul tabindex="0" class="menu menu-lg dropdown-content bg-base-100 rounded-box w-60 shadow-sm">
      <li v-for="link in links" :class="{ active: route.path === link.path }">
        <a @click="router.replace({ path: link.path })"> {{ link.name }}</a>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.active {
  background-color: cornflowerblue;
  border-radius: 4px;
}
</style>
