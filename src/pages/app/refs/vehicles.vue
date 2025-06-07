<route lang="yaml">
meta:
layout: app
</route>

<script setup lang="ts">
const selectedVehicle = ref(null)
const vehiclesStore = useVehiclesStore()
const ownersStore = useOwnersStore()

function editVehicle(vehicle: Vehicle) {
  selectedVehicle.value = vehicle
}

function onClose() {
  selectedVehicle.value = null
}

const cols = [
  {
    label: 'Unit ID',
    value: (v: Vehicle) => v.unit_id,
    size: 120,
  },
  {
    label: 'VIN',
    value: (v: Vehicle) => v.vin,
    size: 200,
  },
  {
    label: 'Owner',
    // value: (v: Vehicle) =>
    //   resolve(
    //     v,
    //     'owner',
    //     () => ({ name: '?' }),
    //     () => ownersStores.resolve(v.owner),
    //     (map) => map.name,
    //   ),
    value: (v: Vehicle) => ownersStore.resolve(v.owner)?.name || '???',
    size: 300,
  },
]
</script>

<template>
  <VehicleModal :edit="selectedVehicle" @closed="onClose"></VehicleModal>
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
      <tr v-for="vehicle in vehiclesStore.listing" :key="vehicle.id" @click="editVehicle(vehicle)">
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
