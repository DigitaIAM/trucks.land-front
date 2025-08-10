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
import {
  type DriverPaymentRecord,
  type DriverPaymentSummary,
  useReportDriver,
} from '@/stores/report_driver.ts'

const reportDriverStore = useReportDriver()
const driversStore = useDriversStore()

const state = reactive({})

const selectedDriver = ref(null)

defineOptions({
  __loaders: [useOrgData],
})

function openPayment(record: DriverPaymentRecord) {
  selectedDriver.value = record.driver
}

function onClose() {
  selectedDriver.value = null
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

const cols = [
  {
    label: 'Driver',
    value: (v: DriverPaymentSummary) =>
      resolve(
        v,
        'driver',
        () => ({ name: '-' }),
        () => driversStore.resolve(v.driver),
        (map) => map.name,
      ),
    size: 200,
  },
  {
    label: 'Orders',
    value: (v: DriverPaymentSummary) => v.number_of_orders,
    size: 100,
  },
  {
    label: 'Orders Amount',
    value: (v: DriverPaymentSummary) => '$' + v.amount_in_orders,
    size: 100,
  },
  {
    label: 'Payment',
    value: (v: DriverPaymentSummary) => '$' + v.payments,
    size: 100,
  },
  {
    label: 'Expenses',
    value: (v: DriverPaymentSummary) => '$' + v.expenses,
    size: 100,
  },
  {
    label: 'Profit',
    value: (v: DriverPaymentSummary) => '$' + (v.amount_in_orders - v.payments - v.expenses),
    size: 100,
  },
  {
    label: 'Profit',
    value: (v: DriverPaymentSummary) =>
      Math.floor(((v.amount_in_orders - v.payments - v.expenses) / v.amount_in_orders) * 100) + '%',
    size: 100,
  },
]
</script>

<template>
  <DriverPayment :driver-id="selectedDriver" @closed="onClose"></DriverPayment>
  <div class="flex flex-row gap-6 px-4 mb-2 mt-3">
    <Text size="2xl">Driver expenses</Text>
    <Search store=""></Search>
  </div>
  <table class="w-full mt-6 text-left table-auto min-w-max">
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
      <tr
        v-for="order in reportDriverStore.drivers"
        :key="order.driver"
        @click="openPayment(order)"
      >
        <td
          v-for="col in cols"
          :key="'row_' + col.label + '_' + order.driver"
          class="py-3 px-4"
          :style="{ width: col.size + 'px' }"
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
