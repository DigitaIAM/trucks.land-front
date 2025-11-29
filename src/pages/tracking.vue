<route lang="yaml">
# @formatter:off
meta:
  layout: clean
</route>


<script setup lang="ts">
import moment from 'moment'
import type { KV } from '@/utils/kv.ts'

const ordersTrackingStore = useOrdersTracking()
const organizationsStore = useOrganizationsStore()
const statusesStore = useStatusesStore()
const vehiclesStore = useVehiclesStore()
const driversStore = useDriversStore()

const filters = ref([] as Array<KV>)


interface Col {
  label: string
  size: number

  value(v: OrderTracking): string
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

function generateStyle(col: Col, order: Order) {
  const color = resolve(
    order,
    'status_' + order.stage,
    () => ({
      name: '?',
      color: '',
    }),
    () => statusesStore.resolve(order.stage),
    (obj) => obj.color,
  )
  if (color && col.label === 'status') {
    return { 'background-color': color }
  }
  return {}
}

function formatDT(ts: Date) {
  const date = new Date(ts)
  const today = new Date()
  if (today.getFullYear() === date.getFullYear()) {
    if (today.getMonth() === date.getMonth()) {
      if (today.getDate() === date.getDate()) {
        return moment(date).format('h:mm a')
      } else {
        return moment(date).format('Do, h:mm a')
      }
    } else {
      return moment(date).format('MMM Do, h:mm a')
    }
  } else {
    return moment(date).format('MMM Do YYYY, h:mm a')
  }
}

const cols: Col[] = [
  {
    label: 'org',
    value: (v: OrderTracking) =>
      resolve(
        v,
        'org_' + v.order.organization,
        () => ({ name: '-', color: '' }),
        () => organizationsStore.resolve(v.order.organization),
        (map) => map.code3,
      ),
    size: 40,
  } as Col,
  {
    label: '#',
    value: (v: OrderTracking) => v.order.number.toString(),
    size: 60,
  } as Col,
  {
    label: 'refs',
    value: (v: OrderTracking) => v.order.refs,
    size: 90,
  } as Col,
  {
    label: 'status',
    value: (v: OrderTracking) =>
      resolve(
        v,
        'status_' + v.order.stage,
        () => ({ name: '?', color: '' }),
        () => statusesStore.resolve(v.order.stage),
        (map) => map.name,
      ),
    size: 112,
  } as Col,
  {
    label: 'driver',
    value: (v: OrderTracking) =>
      resolve(
        v,
        'driver_' + v.order.driver,
        () => ({ name: '-' }),
        () => driversStore.resolve(v.order.driver),
        (map) => map.name,
      ),
    size: 150,
  } as Col,
  {
    label: 'vehicle',
    value: (v: OrderTracking) =>
      resolve(
        v,
        'vehicle_' + v.order.vehicle,
        () => ({ name: '-' }),
        () => vehiclesStore.resolve(v.order.vehicle),
        (map) => map.name?.toLowerCase() || '',
      ),
    size: 80,
  } as Col,
  // {
  //   label: 'kind',
  //   value: (v: OrderTracking) => (v.event.kind ? v.event.kind.substring(0, 1).toUpperCase() : ''),
  //   size: 12,
  // } as Col,
  {
    label: 'time',
    value: (v: OrderTracking) => (v.event.datetime ? formatDT(v.event.datetime) : ''),
    size: 115,
  } as Col,
  {
    label: 'address',
    value: (v: OrderTracking) =>
      (v.event.state ? v.event.state : '') +
      (v.event.zip ? ' ' + v.event.zip : '') +
      (v.event.city ? ' ' + v.event.city : '') +
      (v.event.address ? ' ' + v.event.address : ''),
    size: 200,
  } as Col,
  {
    label: 'notes',
    value: (v: OrderTracking) => v.event.details.notes || '',
    size: 200,
  } as Col,
]

async function openOrder(order: Order) {
  const org = await organizationsStore.resolve(order.organization)
  if (org) {
    window.open('/' + org.code3.toLowerCase() + '/order/' + order.id, '_blank')
  }
}

function setFilter(key: string, val: never) {
  const index = filters.value.findIndex((v) => v.key === key)
  if (index < 0) {
    filters.value.push({ key: key, val: val } as KV)
  } else {
    filters.value[index] = { key: key, val: val } as KV
  }

  ordersStore.setFilters(filters.value)
}

function delFilter(key: string) {
  const index = filters.value.findIndex((v) => v.key === key)
  if (index >= 0) {
    filters.value.splice(index, 1)
  }

  ordersStore.setFilters(filters.value)
}

function capitalizeFirstLetter(val: string) {
  return String(val).charAt(0).toUpperCase() + String(val).slice(1)
}
</script>

<template>
  <div class="flex flex-row gap-6 px-4 mb-2 mt-3">
    <SearchAll @selected="setFilter"></SearchAll>
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
          class="p-2"
          :style="{ width: col.size + 'px' }"
        >
          <p class="block antialiasing tracking-wider font-thin leading-none">
            {{ col.label }}
          </p>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="record in ordersTrackingStore.listing"
        :key="record.event.id"
        class="hover:bg-base-300"
        @click="openOrder(record.order)"
      >
        <td
          v-for="col in cols"
          :key="'row_' + col.label + '_' + record.event.id"
          class="py-3 px-2"
          :style="generateStyle(col, record.order)"
        >
          <p
            class="block antialiasing tracking-wide font-light leading-normal truncate"
            :style="{ width: col.size + 'px' }"
          >
            {{ col.value(record) }}
          </p>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped></style>
