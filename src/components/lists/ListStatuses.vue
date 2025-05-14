<script setup lang="ts">
const cols = [
  {
    label: 'Name',
    value: (v) => v.name,
    color: (v) => v.stage.color,
    size: 300,
  },
  {
    label: 'Next',
    value: (v) => v.next,
    color: (v) => v.stage.color,
    size: 300,
  },
]

// const statuses = [
//   {
//     name: 'Delivery on site',
//     next: 'Delivered',
//     stage: { label: 'Delivery, on site', color: '#29f0d5' },
//   },
//   {
//     name: 'Loading on site',
//     next: 'Delivery stage, Cancel',
//     stage: { label: 'Loading, on site', color: '#29f0d5' },
//   },
//   {
//     name: 'Delivery stage',
//     next: 'Delivery on site, Cancel',
//     stage: { label: 'Delivery stage', color: '#5bc8aC' },
//   },
//   {
//     name: 'Loading stage',
//     next: 'Loading on site, Cancel, TONU',
//     stage: { label: 'Loading stage', color: '#98dbc6' },
//   },
//   {
//     name: 'Request quick pay',
//     next: 'Approved for payment',
//     stage: { label: 'Request quick pay', color: '' },
//   },
//   {
//     name: 'Delivered',
//     next: 'Approved for payment, Request quick pay',
//     stage: { label: 'Delivered', color: '#eaff00' },
//   },
//   {
//     name: 'TONU',
//     next: 'Wait for payment, Read to pay',
//     stage: { label: 'TONU', color: '#DC2626' },
//   },
//   {
//     name: 'Completed',
//     next: '',
//     stage: { label: 'Completed', color: '#00ff00' },
//   },
//   {
//     name: 'Accepted by factoring company',
//     next: 'Read to pay, Payment on hold',
//     stage: { label: 'Accepted by factoring company', color: '' },
//   },
//   {
//     name: 'Wait for broker payment',
//     next: 'Read to pay, Payment on hold',
//     stage: { label: 'Wait for broker payment', color: '' },
//   },
//   {
//     name: 'Approved for payment',
//     next: 'Wait for broker payment, Send to factoring company',
//     stage: { label: 'Approved for payment', color: '' },
//   },
//   {
//     name: 'Send to factoring company',
//     next: 'Accepted by factoring company, Wait for broker payment',
//     stage: { label: 'Send to factoring company', color: '#a6a737' },
//   },
//   {
//     name: 'Read to pay',
//     next: 'Completed',
//     stage: { label: 'Read to pay', color: '' },
//   },
//   {
//     name: 'Payment on hold',
//     next: 'Read to pay',
//     stage: { label: 'Payment on hold', color: '#1D4ED8' },
//   },
//   {
//     name: 'Draft',
//     next: 'Loading stage, Cancel',
//     stage: { label: 'Draft', color: '' },
//   },
//   {
//     name: 'Cancel',
//     next: '',
//     stage: { label: 'Cancel', color: '' },
//   },
// ]

const statusesStore = useStatusesStore()

function generateStyle(col, status) {
  const style = {} // width: col.size + 'px'
  if (status?.color) {
    style['background-color'] = status.color // col.color(order)
  }
  return style
}
</script>

<template>
  <table class="w-full text-left table-auto min-w-max">
    <thead>
      <tr>
        <th
          v-for="col in cols"
          class="p-4 border-b border-b-gray-300"
          :style="{ width: col.size + 'px' }"
          :key="col.label"
        >
          <p class="block text-sm antialiasing font-bold leading-none">
            {{ col.label }}
          </p>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="status in statusesStore.listing" :key="status.id">
        <td v-for="col in cols" class="py-3 px-4" :style="generateStyle(col, status)">
          <p
            class="block text-sm antialiasing font-normal leading-normal truncate"
            :style="{ width: col.size + 'px' }"
          >
            {{ col.value(status) }}
          </p>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped></style>
