<route lang="yaml">
meta:
layout: app
</route>

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
    <Button class="btn-accent">Create</Button>
  </div>
  <table class="w-full mt-6 text-left table-auto min-w-max">
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
      <tr
        v-for="order in reportDriverStore.drivers"
        :key="order.driver"
        @click="openPayment(order)"
      >
        <td
          v-for="col in cols"
          :key="'row_' + col.label + '_' + order.driver"
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
