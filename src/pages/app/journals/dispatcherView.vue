<script setup lang="ts">
const cols = [
  {
    label: '#',
    value: (v) => v.num,
    size: 90,
  },
  {
    label: 'Dispatcher',
    value: (v) => v.dispatcher,
    size: 120,
  },
  {
    label: 'Broker',
    value: (v) => v.broker,
    size: 180,
  },
  {
    label: 'Driver',
    value: (v) => v.driver,
    size: 180,
  },
  {
    label: 'Vehicle',
    value: (v) => v.vehicle,
    size: 100,
  },
  {
    label: 'Cost',
    value: (v) => '$' + v.cost,
    size: 100,
  },
  {
    label: 'Total miles',
    value: (v) => v.miles,
    size: 100,
  },
]

// const orders = useOrdersStore()

const orders = [
  {
    num: 'T2-37778',
    dispatcher: 'Nate Riviera',
    broker: 'Am Trans Expedite',
    driver: 'Oleksandr Strelbitskyi',
    vehicle: 'V58902',
    cost: 1200,
    miles: '2802',
  },
  {
    num: 'T2-37778',
    dispatcher: 'Sean Turner',
    broker: 'MPV LOGISTICS INC',
    driver: 'Andriy Mykhaylivskyy',
    vehicle: 'V2335',
    cost: 1700,
    miles: '1104',
  },
  {
    num: 'T2-37778',
    dispatcher: 'Tim White',
    broker: 'Wicker Park Logistics',
    driver: 'Gellerman Barat',
    vehicle: 'V58902 ',
    cost: 700,
    miles: '661',
  },
  {
    num: 'T2-37778',
    dispatcher: 'Nate Riviera',
    broker: 'Am Trans Expedite',
    driver: 'Oleksandr Strelbitskyi',
    vehicle: 'V58902',
    cost: 1200,
    miles: '2802',
  },
  {
    num: 'T2-37778',
    dispatcher: 'Sean Turner',
    broker: 'MPV LOGISTICS INC',
    driver: 'Andriy Mykhaylivskyy',
    vehicle: 'V2335',
    cost: 1700,
    miles: '1104',
  },
]
</script>

<template>
  <div class="flex flex-row gap-6 px-4 mb-2 mt-3">
    <Search></Search>
    <Button class="btn" @click="resetAndShow(null)">Create</Button>
  </div>
  <table class="w-full text-left table-auto min-w-max">
    <thead>
      <tr>
        <th
          v-for="col in cols"
          class="p-4 border-b border-b-gray-300"
          :style="{ width: col.size + 'px' }"
        >
          <p class="block text-sm antialiasing font-bold leading-none opacity-70">
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
