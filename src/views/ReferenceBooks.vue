<script setup lang="ts">
import BrokerIcon from '../assets/icons/handshake.svg?url'
import DriverIcon from '../assets/icons/driver.svg?url'
import VehicleIcon from '../assets/icons/vehicle.svg?url'
import OwnerIcon from '../assets/icons/bussness_center.svg?url'
import UsersIcon from '../assets/icons/users.svg?url'
import StatusIcon from '../assets/icons/status.svg?url'
import OrganizationsIcon from '../assets/icons/organizations.svg?url'

const buttons = [
  {
    label: 'Brokers',
    icon: BrokerIcon,
  },
  {
    label: 'Drivers',
    icon: DriverIcon,
  },
  {
    label: 'Vehicles',
    icon: VehicleIcon,
  },
  {
    label: 'Owners',
    icon: OwnerIcon,
  },
  {
    label: 'Users',
    icon: UsersIcon,
  },
  {
    label: 'Statuses',
    icon: StatusIcon,
  },
  {
    label: 'Organizations',
    icon: OrganizationsIcon,
  },
]
</script>

<template>
  <div class="flex text-3xl text-gray-700 font-bold pb-10">
    <h1>Reference books</h1>
  </div>

  <div class="flex space-x-8">
    <div v-for="button in buttons" class="">
      <div
        class="size-32 place-items-center p-6 space-y-1 bg-white cursor-pointer border border-gray-300 rounded-lg transform transition-all hover:scale-105"
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
