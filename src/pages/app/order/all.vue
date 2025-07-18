<route lang="yaml">
meta:
layout: app
</route>

<script setup lang="ts">
import Create from '@/pages/app/order/create.vue'
import { useStatusesStore } from '@/stores/statuses.ts'
import { useUsersStore } from '@/stores/users.ts'
import { useCommentsStore } from '@/stores/comments.ts'

const ordersStore = useOrdersStore()
const brokersStore = useBrokersStore()
const statusesStore = useStatusesStore()
const usersStore = useUsersStore()
const organizationsStore = useOrganizationsStore()
const vehiclesStore = useVehiclesStore()
const driversStore = useDriversStore()
const commentsStore = useCommentsStore()

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
    'status',
    () => ({
      name: '?',
      color: '',
    }),
    () => statusesStore.resolve(order?.status),
    (obj) => obj.color,
  )
  if (color) {
    return { 'background-color': color }
  }
  return {}
}

const cols = [
  {
    label: '',
    value: (v: Order) =>
      resolve(
        v,
        'organization',
        () => ({ code3: '?' }),
        () => organizationsStore.resolve(v.organization),
        (map) => map.code3,
      ),
    color: (v: Status) => v.color,
    size: 50,
  },
  {
    label: '#',
    value: (v: Order) => v.id,
    color: (v: Status) => v.color,
    size: 100,
  },
  {
    label: 'Dispatcher',
    value: (v: Order) =>
      resolve(
        v,
        'dispatcher',
        () => ({ name: '?' }),
        () => usersStore.resolve(v.dispatcher),
        (map) => map.name,
      ),
    color: (v: Status) => v.color,
    size: 120,
  },
  {
    label: 'Refs',
    value: (v: Order) => v.refs,
    color: (v: Status) => v.color,
    size: 90,
  },
  {
    label: 'Broker',
    value: (v: Order) =>
      resolve(
        v,
        'broker',
        () => ({ name: '?' }),
        () => brokersStore.resolve(v.broker),
        (map) => map.name,
      ),
    color: (v: Status) => v.color,
    size: 180,
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
    label: 'Cost',
    value: (v: Order) => '$' + v.cost,
    color: (v: Status) => v.color,
    size: 80,
  },
  {
    label: 'Spend',
    value: (v) => '$' + v.driver_cost,
    color: (v: Status) => v.color,
    size: 80,
  },
  {
    label: 'Status',
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
    label: 'Notes',
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
  console.log('openOrder', id)
  window.open('/app/order/' + id, '_blank')
}

function setFilter(key, val) {
  console.log('setFilter', key, val)
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
    <Badge lg outline v-for="filter in filters" :key="filter.key" @click="delFilter(filter.key)"
      >{{ capitalizeFirstLetter(filter.key) }}: {{ filter.val.name }}
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
      <tr>
        <th
          v-for="col in cols"
          :key="'head_' + col.label"
          class="p-4 border-b border-b-gray-400"
          :style="{ width: col.size + 'px' }"
        >
          <p class="block antialiasing font-bold leading-none">
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
          class="py-3 px-4 border-b border-b-gray-400"
          :style="generateStyle(col, order)"
        >
          <p
            class="block antialiasing font-normal leading-normal truncate"
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
