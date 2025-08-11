<script setup lang="ts">
import AvatarUser from '@/components/AvatarUser.vue'

const router = useRouter()
const route = useRoute()

const links = [
  {
    name: 'Orders',
    icon: defineAsyncComponent(() => import('~icons/streamline/multiple-file-2')),
    path: '/order/all',
  },
  {
    name: 'Dispatcher',
    icon: defineAsyncComponent(() => import('~icons/streamline/customer-support-1')),
    path: '/journals/dispatcherView',
  },
  // {
  //   name: 'Tracking',
  //   icon: defineAsyncComponent(() => import('~icons/streamline/location-pin-3')),
  //   path: '/journals/trackingView',
  // },
  {
    name: 'Check out',
    icon: defineAsyncComponent(() => import('~icons/streamline/check-square')),
    path: '/journals/check-outView',
  },
  {
    name: 'Income',
    icon: defineAsyncComponent(() => import('~icons/streamline/subscription-cashflow')),
    path: '/journals/incomeView',
  },
  {
    name: 'Quick pay',
    icon: defineAsyncComponent(() => import('~icons/streamline/credit-card-1')),
    path: '/journals/quick_payView',
  },
  {
    name: 'Reference books',
    icon: defineAsyncComponent(() => import('~icons/streamline/open-book')),
    path: '/referenceBooks',
  },
  // {
  //   name: 'Reports',
  //   icon: defineAsyncComponent(() => import('~icons/streamline/task-list')),
  //   path: '/reportsView',
  // },
  {
    name: 'Finances',
    icon: defineAsyncComponent(() => import('~icons/streamline/briefcase-dollar')),
    path: '/financesView',
  },
]

const authStore = useAuthStore()

function generateAndGo(path: string) {
  // console.log('generateAndGo', path)
  openNav('min')

  const link = '/' + authStore.org?.code3.toLowerCase() + path
  router.replace({ path: link })
}

const colorMode = useColorMode()

function setDark(val: string) {
  const moon = document.querySelector('.moon')
  const sun = document.querySelector('.sun')

  if (val === 'dark') {
    colorMode.preference = 'light'
    document.documentElement.classList.add('dark')
    moon.classList.add('hidden')
    sun.classList.remove('hidden')
  } else {
    colorMode.preference = 'dark'
    document.documentElement.classList.remove('dark')
    sun.classList.add('hidden')
    moon.classList.remove('hidden')
  }
}

function openNav(mode: string | null) {
  const sidebar = document.querySelector('aside')
  const maxSidebar = document.querySelector('.max')
  const miniSidebar = document.querySelector('.mini')
  const maxToolbar = document.querySelector('.max-toolbar')
  // const logo = document.querySelector('.logo')
  // const content = document.querySelector('.content')

  if (sidebar.classList.contains('-translate-x-46')) {
    if (mode == null || mode == 'max') {
      // max sidebar
      sidebar.classList.remove('-translate-x-46')
      sidebar.classList.add('translate-x-none')
      maxSidebar.classList.remove('hidden')
      maxSidebar.classList.add('flex')
      miniSidebar.classList.remove('flex')
      miniSidebar.classList.add('hidden')
      maxToolbar.classList.add('translate-x-0')
      maxToolbar.classList.remove('translate-x-24', 'scale-x-0')
      // logo.classList.remove('ml-12')
      // content.classList.remove('ml-12')
      // content.classList.add('ml-12', 'md:ml-60')
    }
  } else {
    if (mode == null || mode == 'min') {
      // mini sidebar
      sidebar.classList.add('-translate-x-46')
      sidebar.classList.remove('translate-x-none')
      maxSidebar.classList.add('hidden')
      maxSidebar.classList.remove('flex')
      miniSidebar.classList.add('flex')
      miniSidebar.classList.remove('hidden')
      maxToolbar.classList.add('translate-x-24', 'scale-x-0')
      maxToolbar.classList.remove('translate-x-0')
      // logo.classList.add('ml-12')
      // content.classList.remove('ml-12', 'md:ml-60')
      // content.classList.add('ml-12')
    }
  }
}
</script>

<template>
  <aside
    class="w-60 -translate-x-46 fixed transition transform ease-in-out duration-1000 z-50 flex h-screen bg-[#1E293B]"
  >
    <!-- MAX SIDEBAR-->
    <div class="max hidden text-white mt-20 flex-col space-y-2 w-full h-[calc(100vh)]">
      <div
        v-for="link in links"
        :class="{ active: route.path.endsWith(link.path) }"
        :key="link.path"
        @click="generateAndGo(link.path)"
        class="flex-row items-center px-6 hover:ml-4 pr-5 text-white hover:text-purple-500 dark:hover:text-blue-500 w-full bg-[#1E293B] p-3 rounded-full transform ease-in-out duration-300 flex"
      >
        <div class="flex-none">
          <component :is="link.icon"></component>
        </div>
        <Text
          :class="{ active: route.path.endsWith(link.path) }"
          class="grow px-3 font-thin tracking-wider"
          >{{ link.name }}
        </Text>
      </div>
    </div>
      <div class="fixed flex flex-col-2 items-center right-5 sm:bottom-5 w-full px-10 transition-colors duration-200 dark:hover:bg-gray-800 gap-x-2 hover:bg-gray-100 focus:outline-none">
        <div>
          <AvatarUser :username="authStore.account?.name ?? authStore.user?.email"></AvatarUser>
        </div>
        <div class="flex flex-row-2">
         <Text class="pl-2">{{ authStore.account?.name ?? authStore.user?.email}}</Text>
        </div>
      </div>

    <!-- MINI SIDEBAR-->
    <div class="mini mt-20 flex flex-col space-y-2 w-full h-[calc(100vh)]">
      <div
        v-for="link in links"
        :class="{ active: route.path.endsWith(link.path) }"
        :key="link.path"
        @click="generateAndGo(link.path)"
        class="hover:ml-4 justify-end pr-5 text-white hover:text-purple-500 dark:hover:text-blue-500 w-full bg-[#1E293B] p-3 rounded-full transform ease-in-out duration-300 flex"
      >
        <component :is="link.icon"></component>
      </div>
      <div
        class="fixed flex justify-end px-2 sm:bottom-5 w-full transform ease-in-out duration-300"
      >
        <AvatarUser :username="authStore.account?.name ?? authStore.user?.email"></AvatarUser>
      </div>
    </div>
    <!-- open sidebar button -->
    <div
      class="max-toolbar translate-x-24 scale-x-0 w-full -right-6 transition transform ease-in duration-300 flex items-center justify-between border-4 border-white dark:border-[#0F172A] bg-[#1E293B] absolute top-2 rounded-full h-12"
    >
      <div class="flex pl-4 items-center space-x-2">
        <div>
          <div
            @click="setDark('dark')"
            class="moon text-white hover:text-blue-500 dark:hover:text-blue-500"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="size-5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
              />
            </svg>
          </div>
          <div
            @click="setDark('light')"
            class="sun hidden text-white hover:text-blue-500 dark:hover:text-blue-500"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="size-5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
              />
            </svg>
          </div>
        </div>
      </div>
      <div
        class="flex items-center space-x-3 group dark:from-cyan-500 dark:to-blue-500 from-indigo-500 via-purple-500 to-purple-500 pl-10 pr-2 py-1 rounded-full text-white"
      >
        <!--        <div class="transform ease-in-out duration-300 mr-12">Trucks.land</div>-->
      </div>
    </div>
    <div
      @click="openNav(null)"
      class="-right-8 transition transform ease-in-out duration-500 flex border-4 border-white dark:border-[#0F172A] bg-[#1E293B] dark:hover:bg-[#0269d1] hover:bg-purple-500 absolute top-2 p-3 rounded-full text-white hover:rotate-45"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="size-5"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
        />
      </svg>
    </div>
  </aside>
</template>

<style scoped>
.active {
  color: #0269d1;
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 20px;
  font-weight: bold;
  user-select: none;
}
</style>
