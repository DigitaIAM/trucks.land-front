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
const selectedVehicle = ref(null)
const vehiclesStore = useVehiclesStore()
const ownersStore = useOwnersStore()

const state = reactive({})

defineOptions({
  __loaders: [useOrgData],
})

function resolve(
  order: Order,
  name: string,
  create: () => object,
  request: () => Promise<object | null>,
  label: (obj: object) => string,
) {
  const s = state[order.id] ?? {}
  if (s && s[name]) {
    return label(s[name])
  } else {
    s[name] = create()
    state[order.id] = s
    request().then((obj) => {
      if (obj) state[order.id][name] = obj
    })
    return label(s[name])
  }
}

function editVehicle(vehicle: Vehicle) {
  selectedVehicle.value = vehicle
}

function onClose() {
  selectedVehicle.value = null
}

const cols = [
  {
    label: 'Unit ID',
    value: (v: Vehicle) => v.unit_id,
    size: 120,
  },
  {
    label: 'VIN',
    value: (v: Vehicle) => v.vin,
    size: 200,
  },
  {
    label: 'Owner',
    value: (v: Vehicle) =>
      resolve(
        v,
        'owner',
        () => ({ name: '?' }),
        () => ownersStore.resolve(v.owner),
        (map) => map.name,
      ),
    size: 200,
  },
]

const searchQuery = ref('')
const queryStr = ref('')

let timer: ReturnType<typeof setTimeout>
const delay = 250

watch(
  () => searchQuery.value,
  (query: string) => {
    clearTimeout(timer)
    if (query) {
      const text = query
      timer = setTimeout(() => {
        const query = searchQuery.value
        if (text === query) {
          queryStr.value = query.toString().trim().toLowerCase()
        }
      }, delay)
    } else {
      queryStr.value = ''
    }
  },
)
</script>

<template>
  <VehicleModal :edit="selectedVehicle" @closed="onClose"></VehicleModal>
  <table class="w-full text-left table-auto min-w-max">
    <thead>
      <tr
        class="text-sm text-gray-700 uppercase dark:text-gray-400 border-b dark:border-gray-700 border-gray-200"
      >
        <th v-for="col in cols" class="p-4" :style="{ width: col.size + 'px' }">
          <p class="block antialiasing tracking-wider font-thin leading-none">
            {{ col.label }}
          </p>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="vehicle in vehiclesStore.listing" :key="vehicle.id" @click="editVehicle(vehicle)">
        <td v-for="col in cols" class="py-3 px-4" :style="{ width: col.size + 'px' }">
          <p
            class="block antialiasing tracking-wide font-light leading-normal truncate"
            :style="{ width: col.size + 'px' }"
          >
            {{ col.value(vehicle) }}
          </p>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped></style>
