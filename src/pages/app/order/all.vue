<route lang="yaml">
meta:
layout: app
</route>

<script setup lang="ts">
import Create from '@/pages/app/order/create.vue'
import { useStatusesStore } from '@/stores/statuses.ts'
import { useUsersStore } from '@/stores/users.ts'

const ordersStore = useOrdersStore()
const brokersStore = useBrokersStore()
const statusesStore = useStatusesStore()
const usersStore = useUsersStore()
const organizationsStore = useOrganizationsStore()

const state = reactive({})

const selectedOrder = ref(null)

function onClose() {
  selectedOrder.value = null
}

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
    value: (v) => v.driver,
    color: (v: Status) => v.color,
    size: 180,
  },
  {
    label: 'Vehicle',
    value: (v) => v.vehicle,
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
    value: (v) => v.spend,
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
    value: (v) => v.notes,
    color: (v: Status) => v.color,
    size: 300,
  },
]

function openOrder(id: number) {
  console.log('openOrder', id)
  window.open('/app/order/' + id, '_blank')
}
</script>

<template>
  <create :edit="selectedOrder" @closed="onClose"></create>
  <table class="w-full text-left table-auto min-w-max">
    <thead>
      <tr>
        <th
          v-for="col in cols"
          :key="'head_' + col.label"
          class="p-4 border-b border-b-gray-300"
          :style="{ width: col.size + 'px' }"
        >
          <p class="block text-sm antialiasing font-bold leading-none">
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
          class="py-3 px-4 border-b border-b-gray-300"
          :style="generateStyle(col, order)"
        >
          <p
            class="block text-sm antialiasing font-normal leading-normal truncate"
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
