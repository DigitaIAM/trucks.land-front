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
]
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
            <p class="block text-sm antialiasing font-bold leading-none text-gray-900 opacity-70">
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
              class="block text-sm antialiasing font-normal leading-normal text-gray-900 truncate"
              :style="{ width: col.size + 'px' }"
            >
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
