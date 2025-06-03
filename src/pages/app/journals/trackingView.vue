<script setup lang="ts">
import List from '@/components/lists/ListOfTracking.vue'
import Search from '@/components/windowElements/Search.vue'

const cols = [
  {
    label: '#',
    value: (v) => v.num,
    size: 100,
  },
  {
    label: 'Status',
    value: (v) => v.stage.label,
    color: (v) => v.stage.color,
    size: 150,
  },
  {
    label: 'Refs',
    value: (v) => v.ref,
    size: 90,
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
    label: 'Pick up',
    value: (v) => v.pickUp,
    size: 300,
  },
  {
    label: 'Delivery',
    value: (v) => v.delivery,
    size: 300,
  },
]

// const orders = useOrdersStore()

const orders = [
  {
    num: 'T2-37778',
    stage: { label: 'Loading stage', color: '#98dbc6' },
    ref: '2006721',
    driver: 'Oleksandr Strelbitskyi',
    vehicle: 'V58902',
    pickUp: 'West Walley City / UT / 84128   10 Feb, 2025 20:00',
    delivery: 'Saint Paul / MN / 55121 12 Feb, 2025  01:00',
  },
  {
    num: 'T2-37778',
    stage: { label: 'Loading stage', color: '#98dbc6' },
    ref: '2006721',
    driver: 'Andriy Mykhaylivskyy',
    vehicle: 'V2335',
    pickUp: 'West Walley City / UT / 84128   10 Feb, 2025 20:00',
    delivery: 'Saint Paul / MN / 55121 12 Feb, 2025  01:00 ',
  },
  {
    num: 'T2-37778',
    stage: { label: 'Loading stage', color: '#98dbc6' },
    ref: '2006721',
    driver: 'Oleksandr Strelbitskyi',
    vehicle: 'V58902',
    pickUp: 'West Walley City / UT / 84128 10 Feb, 2025 20:00',
    delivery: 'Saint Paul / MN / 55121   12 Feb, 2025  01:00',
  },
  {
    num: 'T2-37778',
    stage: { label: 'Loading, on site', color: '#29f0d5' },
    ref: '2006721',
    driver: 'Andriy Mykhaylivskyy',
    vehicle: 'V2335',
    pickUp: 'West Walley City / UT / 84128 10 Feb, 2025 20:00',
    delivery: 'Saint Paul / MN / 55121  12 Feb, 2025  01:00',
  },
  {
    num: 'T2-37778',
    stage: { label: 'Loading stage', color: '#98dbc6' },
    ref: '2006721',
    driver: 'Oleksandr Strelbitskyi',
    vehicle: 'V58902',
    pickUp: 'West Walley City / UT / 84128 10 Feb, 2025 20:00',
    delivery: 'Saint Paul / MN / 55121  01:00  12 Feb, 2025',
  },
  {
    num: 'T2-37778',
    stage: { label: 'Loading, on site', color: '#29f0d5' },
    ref: '2006721',
    driver: 'Andriy Mykhaylivskyy',
    vehicle: 'V2335',
    pickUp: 'West Walley City / UT / 84128 10 Feb, 2025 20:00',
    delivery: 'Saint Paul / MN / 55121  01:00  12 Feb, 2025',
  },
  {
    num: 'T2-37778',
    stage: { label: 'Delivery stage', color: '#5bc8aC' },
    ref: '2006721',
    driver: 'Oleksandr Strelbitskyi',
    vehicle: 'V58902',
    pickUp: 'West Walley City / UT / 84128 10 Feb, 2025 20:00',
    delivery: 'Saint Paul / MN / 55121  01:00  12 Feb, 2025',
  },
  {
    num: 'T2-37778',
    stage: { label: 'Delivery stage', color: '#5bc8aC' },
    ref: '2006721',
    driver: 'Andriy Mykhaylivskyy',
    vehicle: 'V2335',
    pickUp: 'West Walley City / UT / 84128 10 Feb, 2025 20:00',
    delivery: 'Saint Paul / MN / 55121  01:00  12 Feb, 2025',
  },
  {
    num: 'T2-37778',
    stage: { label: 'Loading stage', color: '#98dbc6' },
    ref: '2006721',
    driver: 'Oleksandr Strelbitskyi',
    vehicle: 'V58902',
    pickUp: 'West Walley City / UT / 84128 10 Feb, 2025 20:00',
    delivery: 'Saint Paul / MN / 55121  01:00  12 Feb, 2025',
  },
  {
    num: 'T2-37778',
    stage: { label: 'Loading stage', color: '#98dbc6' },
    ref: '2006721',
    driver: 'Andriy Mykhaylivskyy',
    vehicle: 'V2335',
    pickUp: 'West Walley City / UT / 84128 10 Feb, 2025 20:00',
    delivery: 'Saint Paul / MN / 55121  01:00  12 Feb, 2025',
  },
  {
    num: 'T2-37778',
    stage: { label: 'Delivery stage', color: '#5bc8aC' },
    ref: '2006721',
    driver: 'Oleksandr Strelbitskyi',
    vehicle: 'V58902',
    pickUp: 'West Walley City / UT / 84128 10 Feb, 2025 20:00',
    delivery: 'Saint Paul / MN / 55121  01:00  12 Feb, 2025',
  },
  {
    num: 'T2-37778',
    stage: { label: 'Loading stage', color: '#98dbc6' },
    ref: '2006721',
    driver: 'Andriy Mykhaylivskyy',
    vehicle: 'V2335',
    pickUp: 'West Walley City / UT / 84128 10 Feb, 2025 20:00',
    delivery: 'Saint Paul / MN / 55121  01:00  12 Feb, 2025',
  },
  {
    num: 'T2-37778',
    stage: { label: 'Delivery stage', color: '#5bc8aC' },
    ref: '2006721',
    driver: 'Oleksandr Strelbitskyi',
    vehicle: 'V58902',
    pickUp: 'West Walley City / UT / 84128 10 Feb, 2025 20:00',
    delivery: 'Saint Paul / MN / 55121  01:00  12 Feb, 2025',
  },
  {
    num: 'T2-37778',
    stage: { label: 'Delivery stage', color: '#5bc8aC' },
    ref: '2006721',
    driver: 'Andriy Mykhaylivskyy',
    vehicle: 'V2335',
    pickUp: 'West Walley City / UT / 84128 10 Feb, 2025 20:00',
    delivery: 'Saint Paul / MN / 55121  01:00  12 Feb, 2025',
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
  <table class="w-full mt-10 text-left table-auto min-w-max">
    <thead>
      <tr>
        <th
          v-for="col in cols"
          class="p-4 border-b border-b-gray-300"
          :style="{ width: col.size + 'px' }"
        >
          <p class="block font-sans text-sm antialiasing font-bold leading-none opacity-70">
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
          <p class="block text-sm antialiasing font-normal leading-normal truncate">
            {{ col.value(order) }}
          </p>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped></style>
