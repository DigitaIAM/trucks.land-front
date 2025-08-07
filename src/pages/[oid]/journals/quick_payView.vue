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
import { useUsersStore } from '@/stores/users.ts'
import { useStatusesStore } from '@/stores/statuses.ts'

const orders = useOrdersStore()
const brokersStore = useBrokersStore()
const usersStore = useUsersStore()
const statusesStore = useStatusesStore()
const vehiclesStore = useVehiclesStore()
const commentsStore = useCommentsStore()

defineOptions({
  __loaders: [useOrgData],
})

const orgData = useOrgData()

orders.setContext([{ key: 'status', val: '22' } as KV])

const filters = ref([])

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

const cols = [
  {
    label: '#',
    value: (v: Order) => v.id,
    size: 50,
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
    size: 120,
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
    size: 150,
  },
  {
    label: 'Refs',
    value: (v: Order) => v.refs,
    size: 90,
  },
  {
    label: 'Cost',
    value: (v: Order) => '$ ' + v.cost,
    size: 80,
  },
  {
    label: 'D/payment',
    value: (v) => '$' + v.driver_cost,
    size: 80,
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
    size: 150,
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
    size: 80,
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
  window.open('/' + orgData.data.value.code3.toLowerCase() + '/order/' + id, '_blank')
}

function setFilter(key, val) {
  const index = filters.value.findIndex((v) => v.key === key)
  if (index < 0) {
    filters.value.push({ key: key, val: val })
  } else {
    filters.value[index] = { key: key, val: val }
  }

  orders.setFilters(filters.value)
}

function delFilter(key) {
  const index = filters.value.findIndex((v) => v.key === key)
  if (index >= 0) {
    filters.value.splice(index, 1)
  }

  orders.setFilters(filters.value)
}

function capitalizeFirstLetter(val) {
  return String(val).charAt(0).toUpperCase() + String(val).slice(1)
}
</script>

<template>
  <div class="flex flex-row gap-6 px-4 mb-2 mt-3">
    <Text size="2xl">Payments</Text>
    <SearchAll @selected="setFilter"></SearchAll>
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
      <tr v-for="order in orders.listing" :key="order.id" @click="openOrder(order.id)">
        <td
          v-for="col in cols"
          :key="'row_' + col.label + '_' + order.id"
          class="py-3 px-4 border-b border-b-gray-400"
          :style="{ width: col.size + 'px' }"
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
