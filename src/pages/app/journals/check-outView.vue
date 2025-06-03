<script setup lang="ts">
const cols = [
  {
    label: '#',
    value: (v) => v.num,
    size: 100,
  },
  {
    label: 'Dispatcher',
    value: (v) => v.dispatcher,
    size: 120,
  },
  {
    label: 'Week',
    value: (v) => v.week,
    size: 50,
  },
  {
    label: 'Status',
    value: (v) => v.stage,
    size: 150,
  },
  {
    label: 'Invoices',
    value: (v) => v.invoices,
    size: 150,
  },
  {
    label: 'Refs',
    value: (v) => v.ref,
    size: 90,
  },
  {
    label: 'Cost',
    value: (v) => '$' + v.cost,
    size: 80,
  },
  {
    label: 'D/payment',
    value: (v) => '$' + v.spend,
    size: 80,
  },
  {
    label: 'Broker',
    value: (v) => v.broker,
    size: 150,
  },
  {
    label: 'Vehicle',
    value: (v) => v.vehicle,
    size: 80,
  },
]

// const orders = useOrdersStore()

const orders = [
  {
    num: 'T2-37778',
    dispatcher: 'Nate Riviera',
    week: 2,
    stage: 'Delivered',
    invoices: '',
    ref: '2006721',
    cost: 1200,
    spend: 900,
    broker: 'Am Trans Expedite',
    vehicle: 'V58902',
  },
  {
    num: 'T2-37778',
    dispatcher: 'Sean Turner',
    week: 2,
    stage: 'Delivered',
    invoices: '',
    ref: '2006721',
    cost: 1700,
    spend: 1100,
    broker: 'Am Trans Expedite',
    vehicle: 'V58902',
  },
  {
    num: 'T2-37778',
    dispatcher: 'Nate Riviera',
    week: 2,
    stage: 'Delivered',
    invoices: '',
    ref: '2006721',
    cost: 1200,
    spend: 900,
    broker: 'Am Trans Expedite',
    vehicle: 'V58902',
  },
  {
    num: 'T2-37778',
    dispatcher: 'Sean Turner',
    week: 2,
    stage: 'Delivered',
    invoices: '',
    ref: '2006721',
    cost: 1700,
    spend: 1100,
    broker: 'Am Trans Expedite',
    vehicle: 'V58902',
  },
  {
    num: 'T2-37778',
    dispatcher: 'Nate Riviera',
    week: 2,
    stage: 'Delivered',
    invoices: '',
    ref: '2006721',
    cost: 1200,
    spend: 900,
    broker: 'Am Trans Expedite',
    vehicle: 'V58902',
  },
  {
    num: 'T2-37778',
    dispatcher: 'Sean Turner',
    week: 2,
    stage: 'Delivered',
    invoices: '',
    ref: '2006721',
    cost: 1700,
    spend: 1100,
    broker: 'Am Trans Expedite',
    vehicle: 'V58902',
  },
  {
    num: 'T2-37778',
    dispatcher: 'Nate Riviera',
    week: 2,
    stage: 'Delivered',
    invoices: '',
    ref: '2006721',
    cost: 1200,
    spend: 900,
    broker: 'Am Trans Expedite',
    vehicle: 'V58902',
  },
  {
    num: 'T2-37778',
    dispatcher: 'Sean Turner',
    week: 2,
    stage: 'Delivered',
    invoices: '',
    ref: '2006721',
    cost: 1700,
    spend: 1100,
    broker: 'Am Trans Expedite',
    vehicle: 'V58902',
  },
]
</script>

<template>
  <table class="w-full mt-10 text-left table-auto min-w-max">
    <thead>
      <tr>
        <th
          v-for="col in cols"
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
      <tr v-for="order in orders">
        <td
          v-for="col in cols"
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
