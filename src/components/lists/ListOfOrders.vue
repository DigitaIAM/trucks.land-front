<script setup lang="ts">
const cols = [
  {
    label: '',
    value: (v) => v.org,
    size: 50,
  },
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
    label: 'Refs',
    value: (v) => v.ref,
    size: 90,
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
    size: 120,
  },
  {
    label: 'Cost',
    value: (v) => '$' + v.cost,
    size: 80,
  },
  {
    label: 'Spend',
    value: (v) => '$' + v.spend,
    size: 80,
  },
  {
    label: 'Status',
    value: (v) => v.stage.label,
    color: (v) => v.stage.color,
    size: 150,
  },
  {
    label: 'Notes',
    value: (v) => v.notes,
    size: 300,
  },
]

const orders = [
  {
    org: 'CNU',
    num: 'T2-37771',
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
    stage: { label: 'Delivery stage', color: '#5bc8aC' },
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
    stage: { label: 'Delivered', color: '#eaff00' },
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

function generateStyle(col, order) {
  const style = {} // width: col.size + 'px'
  if (order.stage.color) {
    style['background-color'] = order.stage.color // col.color(order)
  }
  return style
}
</script>

<template>
  <div class="text-black bg-white rounded-xl shadow-xl bg-clip-border">
    <table-of-statutes class="w-full text-left table-auto min-w-max">
      <thead>
        <tr>
          <th
            v-for="col in cols"
            class="p-4 border-b border-b-gray-300"
            :style="{ width: col.size + 'px' }"
          >
            <p
              class="block font-sans text-sm antialiasing font-bold leading-none text-gray-900 opacity-70"
            >
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
            <!--            :style="{ width: col.size + 'px' }"-->
            <p class="block text-sm antialiasing font-normal leading-normal text-gray-900">
              {{ col.value(order) }}
            </p>
          </td>
        </tr>
      </tbody>
    </table-of-statutes>

    <div class="flex items-center justify-between p-4">
      <nav aria-label="Page navigation">
        <ul class="inline-flex space-x-2">
          <li>
            <button
              class="flex items-center justify-center w-8 h-8 text-[#313EC6] transition-colors duration-150 rounded-full focus:shadow-outline hover:bg-blue-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="2"
                stroke="currentColor"
                class="size-4"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15.75 19.5 8.25 12l7.5-7.5"
                  clip-rule="evenodd"
                  fill-rule="evenodd"
                />
              </svg>
            </button>
          </li>
          <li>
            <button
              class="w-8 h-8 text-white transition-colors duration-150 bg-[#313EC6] border border-r-0 border-[#313EC6] rounded-full focus:shadow-outline"
            >
              1
            </button>
          </li>
          <li>
            <button
              class="w-8 h-8 text-[#313EC6] transition-colors duration-150 rounded-full focus:shadow-outline hover:bg-blue-100"
            >
              2
            </button>
          </li>
          <li>
            <button
              class="w-8 h-8 text-[#313EC6] transition-colors duration-150 rounded-full focus:shadow-outline hover:bg-blue-100"
            >
              3
            </button>
          </li>
          <li>
            <button
              class="flex items-center justify-center w-8 h-8 text-[#313EC6] transition-colors duration-150 rounded-full focus:shadow-outline hover:bg-blue-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="2"
                stroke="currentColor"
                class="size-4"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="m8.25 4.5 7.5 7.5-7.5 7.5"
                  clip-rule="evenodd"
                  fill-rule="evenodd"
                />
              </svg>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>

<style scoped></style>
