<script setup lang="ts">
import { useStatusesStore } from '@/stores/statuses.ts'
import { useEventsStore } from '@/stores/events.ts'

const ordersStore = useOrdersStore()
const statusesStore = useStatusesStore()
const eventsStore = useEventsStore()
const usersStore = useUsersStore()
const brokersStore = useBrokersStore()

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
    size: 120,
  },
  {
    label: 'Week',
    value: (v) => v.week,
    size: 50,
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
    label: 'Invoices',
    value: (v) => v.invoices,
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
    value: (v) => '$' + v.spend,
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
    value: (v) => v.vehicle,
    size: 80,
  },
]

function openOrder(id: number) {
  console.log('openOrder', id)
  window.open('/app/order/' + id, '_blank')
}
</script>

<template>
  <table class="w-full mt-10 text-left table-auto min-w-max">
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
          :style="{ width: col.size + 'px' }"
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
