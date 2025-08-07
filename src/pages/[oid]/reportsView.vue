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
import BrokerIcon from '../../assets/icons/handshake.svg?url'
import VehicleIcon from '../../assets/icons/vehicle.svg?url'
import OwnerIcon from '../../assets/icons/bussness_center.svg?url'

defineOptions({
  __loaders: [useOrgData],
})

const buttons = [
  {
    label: 'Broker',
    icon: BrokerIcon,
  },
  {
    label: 'Vehicle',
    icon: VehicleIcon,
  },
  {
    label: 'Owner',
    icon: OwnerIcon,
  },
]
</script>

<template>
  <div class="flex text-3xl p-5 font-bold pb-10">
    <h1>Reports</h1>
  </div>

  <div class="flex space-x-8 px-5">
    <div v-for="button in buttons" :key="button.label">
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
