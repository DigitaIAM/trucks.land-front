<route lang="yaml">
meta:
layout: app
</route>

<script setup lang="ts">
const selectedVehicle = ref(null)

function editVehicle(vehicle: Vehicle) {
  selectedVehicle.value = vehicle
}

function onClose() {
  selectedVehicle.value = null
}

const cols = [
  {
    label: 'ID',
    value: (v) => v.id,
    size: 120,
  },
  {
    label: 'VIN',
    value: (v) => v.vin,
    size: 200,
  },
  {
    label: 'Owner',
    value: (v) => v.owner,
    size: 300,
  },
]

const owner = ref(null)

const owners = useOwnersStore()
</script>

<template>
  <VehicleModal :edit="selectedVehicle" @closed="onClose"></VehicleModal>
  test
  <selector v-model="owner" :store="owners"></selector>
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
      <tr v-for="vehicle in vehicles">
        <!--      <tr v-for="vehicle in vehiclesStore.listing" :key="vehicle.id" @click="editVehicle(vehicle)">-->
        <td
          v-for="col in cols"
          class="py-3 px-4 border-b border-b-gray-300"
          :style="{ width: col.size + 'px' }"
        >
          <p
            class="block text-sm antialiasing font-normal leading-normal truncate"
            :style="{ width: col.size + 'px' }"
          >
            {{ col.value(vehicle) }}
          </p>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped></style>
