<route lang="yaml">
# @formatter:off
meta:
  layout: nav-view
</route>

<script lang="ts">
import { defineBasicLoader } from 'unplugin-vue-router/data-loaders/basic'
import type { KV } from '@/utils/kv.ts'

const organizationsStore = useOrganizationsStore()
const authStore = useAuthStore()
const ordersStore = useOrdersStore()

export const useOrgData = defineBasicLoader(
  'oid',
  async (route) => {
    const org = await organizationsStore.resolve3(route.params.oid)
    authStore.org = org
    await ordersStore.setContext([{ key: 'organization', val: org.id } as KV])
    // console.table(org)
    return org
  },
  { key: 'org' },
)
</script>

<script setup lang="ts">
import Create from '@/pages/[oid]/order/create.vue'
import { useStatusesStore } from '@/stores/statuses.ts'
import { useUsersStore } from '@/stores/users.ts'
import { useCommentsStore } from '@/stores/comments.ts'

const ordersStore = useOrdersStore()
const brokersStore = useBrokersStore()
const statusesStore = useStatusesStore()
const usersStore = useUsersStore()
// const organizationsStore = useOrganizationsStore()
const vehiclesStore = useVehiclesStore()
const driversStore = useDriversStore()
const commentsStore = useCommentsStore()

defineOptions({
  __loaders: [useOrgData],
})

const orgData = useOrgData()

// ordersStore.setContext([{ key: 'organization', val: null } as KV])

const filters = ref([])
const selectedOrder = ref(null)

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
    'status_' + order?.status,
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
    value: (v: Order) => v.number,
    color: (v: Status) => v.color,
    size: 50,
  },
  {
    label: 'status',
    value: (v: Order) =>
      resolve(
        v,
        'status_' + v.status,
        () => ({ name: '?', color: '' }),
        () => statusesStore.resolve(v.status),
        (map) => map.name,
      ),
    color: (v: Status) => v.color,
    size: 100,
  },
  {
    label: 'dispatcher',
    value: (v: Order) =>
      resolve(
        v,
        'dispatcher_' + v.dispatcher,
        () => ({ name: '?' }),
        () => usersStore.resolve(v.dispatcher),
        (map) => map.name,
      ),
    color: (v: Status) => v.color,
    size: 100,
  },
  {
    label: 'refs',
    value: (v: Order) => v.refs,
    color: (v: Status) => v.color,
    size: 150,
  },
  {
    label: 'broker',
    value: (v: Order) =>
      resolve(
        v,
        'broker_' + v.broker,
        () => ({ name: '?' }),
        () => brokersStore.resolve(v.broker),
        (map) => map.name,
      ),
    color: (v: Status) => v.color,
    size: 200,
  },
  {
    label: 'driver',
    value: (v: Order) =>
      resolve(
        v,
        'driver_' + v.driver,
        () => ({ name: '-' }),
        () => driversStore.resolve(v.driver),
        (map) => map.name,
      ),
    color: (v: Status) => v.color,
    size: 180,
  },
  {
    label: 'vehicle',
    value: (v: Order) =>
      resolve(
        v,
        'vehicle_' + v.vehicle,
        () => ({ name: '-' }),
        () => vehiclesStore.resolve(v.vehicle),
        (map) => map.name,
      ),
    color: (v: Status) => v.color,
    size: 120,
  },
  {
    label: 'cost',
    value: (v: Order) => '$' + v.cost,
    color: (v: Status) => v.color,
    size: 80,
  },
  {
    label: 'spend',
    value: (v) => '$' + (v.driver_cost ?? 0),
    color: (v: Status) => v.color,
    size: 80,
  },
  {
    label: 'notes',
    value: (v: Order) =>
      resolve(
        v,
        'note',
        () => [],
        () => commentsStore.commentsForOrder(v.id),
        (map) => map[0]?.note ?? '',
      ),
    color: (v: Status) => v.color,
    size: 300,
  },
]

function openOrder(id: number) {
  window.open('/' + orgData.data.value.code3.toLowerCase() + '/order/' + id, '_blank')
  // console.log('org.code3', orgData.data.value.code3)
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
    <div class="flex items-center">
      <span
        class="network-dot"
        :class="{
          'network-connected': ordersStore.changes.state === 'joined',
          'network-connecting': ordersStore.changes.state === 'joining',
          'network-disconnected': !['joining', 'joined'].includes(ordersStore.changes.state),
        }"
      ></span>
    </div>
    <create :edit="selectedOrder" @closed="onClose"></create>
  </div>
  <div class="flex flex-row gap-6 px-4 mb-2 mt-3">
    <Badge lg ghost v-for="filter in filters" :key="filter.key" @click="delFilter(filter.key)">
      <div class="font-thin tracking-wider text-sm text-gray-700 uppercase dark:text-gray-400">
        {{ capitalizeFirstLetter(filter.key) }}:
      </div>
      <div>{{ filter.val.name }}</div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="0.5"
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
          :key="'row_' + col.label + '_' + order.number"
          class="py-3 px-4"
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

<style scoped>
.network-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.network-disconnected {
  background-color: red;
}

.network-connecting {
  background-color: yellow;
}

.network-connected {
  background-color: green;
}
</style>
