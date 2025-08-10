<route lang="yaml">
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
import { useStatusesStore } from '@/stores/statuses.ts'
import { useEventsStore } from '@/stores/events.ts'
import Create from '@/pages/[oid]/order/create.vue'

const ordersStore = useOrdersStore()
const statusesStore = useStatusesStore()
const eventsStore = useEventsStore()
const vehiclesStore = useVehiclesStore()
const driversStore = useDriversStore()

ordersStore.setContext([{ key: 'status', val: ['3', '5', '8', '21'] } as KV])
//3 - Loading stage, 5 - Delivery stage, 8 - Loading on site, 21 - Delivery on site

const filters = ref([])
const selectedOrder = ref(null)

defineOptions({
  __loaders: [useOrgData],
})

const orgData = useOrgData()

function onClose() {
  selectedOrder.value = null
}

const state = reactive({})

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

function generateStyle(col, order) {
  const color = resolve(
    order,
    'status',
    () => ({
      name: '?',
      color: '',
    }),
    () => statusesStore.resolve(order?.status),
    (obj) => obj.color,
  )
  if (color && col?.label === 'status') {
    return { 'background-color': color }
  }
  return {}
}

const cols = [
  {
    label: '#',
    value: (v: Order) => v.id,
    color: (v: Status) => v.color,
    size: 50,
  },
  {
    label: 'status',
    value: (v: Order) =>
      resolve(
        v,
        'status',
        () => ({ name: '?', color: '' }),
        () => statusesStore.resolve(v.status),
        (map) => map.name,
      ),
    color: (v: Status) => v.color,
    size: 150,
  },
  {
    label: 'Refs',
    value: (v: Order) => v.refs,
    color: (v: Status) => v.color,
    size: 90,
  },
  {
    label: 'Driver',
    value: (v: Order) =>
      resolve(
        v,
        'driver',
        () => ({ name: '-' }),
        () => driversStore.resolve(v.driver),
        (map) => map.name,
      ),
    color: (v: Status) => v.color,
    size: 180,
  },
  {
    label: 'Vehicle',
    value: (v: Order) =>
      resolve(
        v,
        'vehicle',
        () => ({ name: '-' }),
        () => vehiclesStore.resolve(v.vehicle),
        (map) => map.name,
      ),
    color: (v: Status) => v.color,
    size: 120,
  },
  {
    label: 'Pick up',
    value: (v: Order) =>
      resolve(
        v,
        'pick_up',
        () => [],
        () => eventsStore.pickUp(v.id),
        (l) => {
          let str = ''
          l.forEach((v) => {
            if (str) {
              str += ', '
            }
            str += v.zip + ' ' + v.state + ' ' + v.city
          })
          return str
        },
      ),
    color: (v: Status) => v.color,
    size: 300,
  },
  {
    label: 'Delivery',
    value: (v: Order) =>
      resolve(
        v,
        'delivery',
        () => [],
        () => eventsStore.delivery(v.id),
        (l) => {
          let str = ''
          l.forEach((v) => {
            if (str) {
              str += ', '
            }
            str += v.zip + ' ' + v.state + ' ' + v.city
          })
          return str
        },
      ),
    color: (v: Status) => v.color,
    size: 300,
  },
]

function openOrder(id: number) {
  window.open('/' + orgData.data.value.code3.toLowerCase() + '/order/' + id, '_blank')
}

function setFilter(key, val) {
  const index = filters.value.findIndex((v) => v.key === key)
  if (index < 0) {
    filters.value.push({ key: key, val: val })
  } else {
    filters.value[index] = { key: key, val: val }
  }

  ordersStore.setFilters(filters.value)
}

function delFilter(key) {
  const index = filters.value.findIndex((v) => v.key === key)
  if (index >= 0) {
    filters.value.splice(index, 1)
  }

  ordersStore.setFilters(filters.value)
}

function capitalizeFirstLetter(val) {
  return String(val).charAt(0).toUpperCase() + String(val).slice(1)
}
</script>

<template>
  <div class="flex flex-row gap-6 px-4 mb-2 mt-3">
    <SearchAll @selected="setFilter"></SearchAll>
    <create :edit="selectedOrder" @closed="onClose"></create>
  </div>
  <div class="flex flex-row gap-6 px-4 mb-2 mt-3">
    <Badge lg ghost v-for="filter in filters" :key="filter.key" @click="delFilter(filter.key)"
    >
      <div class="font-thin tracking-wider text-sm text-gray-700 uppercase dark:text-gray-400">
        {{ capitalizeFirstLetter(filter.key) }}:
      </div>
      <div>{{ filter.val.name }}</div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="size-4"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
      </svg>
    </Badge>
  </div>
  <table class="w-full text-left table-auto min-w-max">
    <thead>
    <tr
      class="text-sm text-gray-700 uppercase dark:text-gray-400 border-b dark:border-gray-700 border-gray-200"
    >
        <th
          v-for="col in cols"
          :key="'head_' + col.label"
          class="p-4"
          :style="{ width: col.size + 'px' }"
        >
          <p class="block antialiasing tracking-wider font-thin leading-none">
            {{ col.label }}
          </p>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="order in ordersStore.listing" :key="order.id" @click="openOrder(order.id)">
        <td
          v-for="col in cols"
          :key="'row_' + col.label + '_' + order.id"
          class="py-3 px-4 "
          :style="generateStyle(col, order)"
        >
          <p
            class="block antialiasing tracking-wide font-light leading-normal truncate"
            :style="{ width: col.size + 'px' }"
          >
            {{ col.value(order) }}
          </p>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped></style>
