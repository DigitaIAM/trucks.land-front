<script setup lang="ts">
const router = useRouter()

function generateStyle(col, order) {
  const style = {} // width: col.size + 'px'
  if (order.stage.color) {
    style['background-color'] = order.stage.color // col.color(order)
  }
  return style
}

const cols = [
  {
    label: '',
    value: (v) => v.org,
    color: (v: Status) => v.color,
    size: 50,
  },
  {
    label: '#',
    value: (v) => v.num,
    color: (v: Status) => v.color,
    size: 100,
  },
  {
    label: 'Dispatcher',
    value: (v) => v.dispatcher,
    color: (v: Status) => v.color,
    size: 120,
  },
  {
    label: 'Refs',
    value: (v) => v.ref,
    color: (v: Status) => v.color,
    size: 90,
  },
  {
    label: 'Broker',
    value: (v) => v.broker,
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
    value: (v) => '$' + v.cost,
    color: (v: Status) => v.color,
    size: 80,
  },
  {
    label: 'Spend',
    value: (v) => '$' + v.spend,
    color: (v: Status) => v.color,
    size: 80,
  },
  {
    label: 'Status',
    value: (v) => v.stage.label,
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

// const orders = useOrdersStore()

const orders = [
  {
    org: 'CNU',
    num: 'T2-37771',
    dispatcher: 'Nate Riviera',
    ref: '2006721',
    broker: 'Am Trans Expedite',
    driver: '',
    vehicle: '',
    cost: 1200,
    spend: 900,
    stage: { label: 'Draft', color: '' },
    notes: '',
  },
  {
    org: 'CNU',
    num: 'T2-37778',
    dispatcher: 'Sean Turner',
    ref: '2006721',
    broker: 'MPV LOGISTICS INC',
    driver: 'Andriy Mykhaylivskyy',
    vehicle: 'V2335',
    cost: 1700,
    spend: 1100,
    stage: { label: 'Loading, on site', color: '#29f0d5' },
    notes: '',
  },
  {
    org: 'CNU',
    num: 'T2-37778',
    dispatcher: 'Tim White',
    ref: '2006721',
    broker: 'Wicker Park Logistics',
    driver: 'Gellerman Barat',
    vehicle: 'V58902 ',
    cost: 700,
    spend: 500,
    stage: { label: 'Delivery stage', color: '#5bc8aC' },
    notes: '',
  },
  {
    org: 'CNU',
    num: 'T2-37778',
    dispatcher: 'Nate Riviera',
    ref: '2006721',
    broker: 'Am Trans Expedite',
    driver: 'Oleksandr Strelbitskyi',
    vehicle: 'V58902',
    cost: 1200,
    spend: 900,
    stage: { label: 'Loading stage', color: '#98dbc6' },
    notes: '$300 from driver pay goes for Unit V2233 Vitaliy Kondratevich',
  },
  {
    org: 'CNU',
    num: 'T2-37778',
    dispatcher: 'Sean Turner',
    ref: '2006721',
    broker: 'MPV LOGISTICS INC',
    driver: 'Andriy Mykhaylivskyy',
    vehicle: 'V2335',
    cost: 1700,
    spend: 1100,
    stage: { label: 'Loading, on site', color: '#29f0d5' },
    notes: '',
  },
]
</script>

<template>
  <div class="flex flex-row gap-6 px-4 mb-2 mt-3">
    <Search></Search>
    <Button class="btn" @click="router.replace('/app/order/create')">Create</Button>
  </div>
  <table class="w-full text-left table-auto min-w-max">
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

<style></style>
