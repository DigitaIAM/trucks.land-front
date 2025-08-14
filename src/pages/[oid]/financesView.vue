<route lang="yaml">
# @formatter:off
meta:
  layout: nav-view
</route>

<script lang="ts">
import { defineBasicLoader } from 'unplugin-vue-router/data-loaders/basic'

const organizationsStore = useOrganizationsStore()
const authStore = useAuthStore()
const ordersStore = useOrdersStore()

export const useOrgData = defineBasicLoader(
  'oid',
  async (route) => {
    const org = await organizationsStore.resolve3(route.params.oid)
    authStore.org = org
    ordersStore.setContext([{ key: 'organization', val: org.id } as KV])
    // console.table(org)
    return org
  },
  { key: 'org' },
)
</script>

<script setup lang="ts">
import DriverIcon from '../../assets/icons/driver.svg?url'
import OwnerIcon from '../../assets/icons/bussness_center.svg?url'
import DispatcherIcon from '../../assets/icons/dispatcher.svg?url'

defineOptions({
  __loaders: [useOrgData],
})

const orgData = useOrgData()

const router = useRouter()

const buttons = [
  // {
  //   label: 'Owner',
  //   icon: OwnerIcon,
  //   link: '',
  // },
  {
    label: 'Driver',
    icon: DriverIcon,
    link: '/' + orgData.data.value.code3.toLowerCase() + '/paymentsAndExpenses/driver_expenses',
  },
  {
    label: 'Dispatcher',
    icon: DispatcherIcon,
    link:
      '/' + orgData.data.value.code3.toLowerCase() + '/paymentsAndExpenses/paymentsToDispatchers',
  },
]
</script>

<template>
  <div class="flex text-3xl p-5 font-bold pb-10">
    <h1>Payments and expenses</h1>
  </div>

  <div class="flex space-x-8 px-5">
    <div
      v-for="button in buttons"
      :key="button.label"
      @click="router.replace({ path: button.link })"
    >
      <div
        class="size-32 place-items-center p-6 space-y-1 bg-white cursor-pointer border border-gray-300 rounded-lg transform transition-all hover:scale-105"
      >
        <img class="size-12" :src="button.icon" alt="" />
        <h5 class="text-lg text-gray-600">{{ button.label }}</h5>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
