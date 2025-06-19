<route lang="yaml">
meta:
layout: app
</route>

<script setup lang="ts">
const cols = [
  {
    label: 'Name',
    value: (v: Driver) => v.name,
    size: 300,
  },
  {
    label: 'Phone',
    value: (v: Driver) => v.phone,
    size: 300,
  },
  {
    label: 'Email',
    value: (v: Driver) => v.email,
    size: 300,
  },
  {
    label: 'Percentage',
    value: (v: Driver) => v.percentage,
    size: 120,
  },
]

const selectedDriver = ref(null)
const driversStore = useDriversStore()

function editDriver(driver: Driver) {
  selectedDriver.value = driver
}

function onClose() {
  selectedDriver.value = null
}
</script>

<template>
  <DriverModal :edit="selectedDriver" @closed="onClose"></DriverModal>
  <table class="w-full text-left table-auto min-w-max">
    <thead>
      <tr>
        <th
          v-for="col in cols"
          class="p-4 border-b border-b-gray-400"
          :style="{ width: col.size + 'px' }"
        >
          <p class="block text-sm antialiasing font-bold leading-none">
            {{ col.label }}
          </p>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="driver in driversStore.listing" :key="driver.id" @click="editDriver(driver)">
        <td
          v-for="col in cols"
          class="py-3 px-4 border-b border-b-gray-400"
          :style="{ width: col.size + 'px' }"
        >
          <p
            class="block text-sm antialiasing font-normal leading-normal truncate"
            :style="{ width: col.size + 'px' }"
          >
            {{ col.value(driver) }}
          </p>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped></style>
