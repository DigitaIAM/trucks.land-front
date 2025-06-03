<script setup lang="ts">
import BrokerIcon from '../../assets/icons/handshake.svg?url'
import VehicleIcon from '../../assets/icons/vehicle.svg?url'
import OwnerIcon from '../../assets/icons/bussness_center.svg?url'

const buttons = [
  {
    label: 'Broker',
    icon: BrokerIcon,
  },
  {
    label: 'Vehicle',
    icon: VehicleIcon,
  },
  {
    label: 'Owner',
    icon: OwnerIcon,
  },
]
</script>

<template>
  <div class="flex text-3xl p-5 font-bold pb-10">
    <h1>Reports</h1>
  </div>

  <div class="flex space-x-8 px-5">
    <div v-for="button in buttons" class="">
      <div
        class="size-32 place-items-center p-6 space-y-1 bg-white cursor-pointer border border-gray-300 rounded-lg transform transition-all hover:scale-105 hover:text-blue-500"
      >
        <img class="size-12" :src="button.icon" alt="" />
        <a href="#">
          <h5 class="text-lg text-gray-600">{{ button.label }}</h5>
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
