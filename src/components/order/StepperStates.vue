<script setup lang="ts">
const props = defineProps<{
  order: number
}>()

const links = [
  { name: 'Pick up', modal: 'pickUp' },
  { name: 'Delivery', modal: 'delivery' },
  { name: 'Change of driver and vehicle', modal: 'change' },
]

const selectedPickup = ref(null)
const selectedDelivery = ref(null)
</script>

<template>
  <PickUpModal :order="props.order" :edit="selectedPickup"></PickUpModal>
  <DeliveryModal :order="props.order" :edit="selectedDelivery"></DeliveryModal>

  <div class="flex mb-2 w-full">
    <div class="grow">
      <ol class="relative text-gray-500 border-l-2 border-gray-500">
        <li class="mb-10 ms-6">
          <span
            class="absolute flex items-center justify-center w-8 h-8 bg-gray-500 rounded-full -start-4"
          >
            <svg
              class="w-5 h-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5"
              />
            </svg>
          </span>
          <h3 class="font-medium leading-tight">Delivery</h3>
          <p class="text-sm">12 Feb, 2025 01:00</p>
          <p class="text-sm">Saint Paul / MN / 55121</p>
        </li>
        <li class="mb-10 ms-6">
          <span
            class="absolute flex items-center justify-center w-8 h-8 rounded-full -start-4 bg-[#F08A34]"
          >
            <svg
              class="w-5 h-5 text-white"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
          </span>
          <h3 class="font-bold text-[#F08A34] leading-tight">Change of driver and vehicle</h3>
          <!--      <p class="text-sm">Step details here</p>-->
        </li>
        <li class="mb-10 ms-6">
          <span
            class="absolute flex items-center justify-center w-8 h-8 rounded-full -start-4 bg-[#68C3A8]"
          >
            <svg
              class="w-5 h-5 text-white"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 16 12"
            >
              <path
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M1 5.917 5.724 10.5 15 1.5"
              />
            </svg>
          </span>
          <h3 class="font-bold text-[#68C3A8] leading-tight">Pick up</h3>
          <p class="text-sm">10 Feb, 2025 20:00</p>
          <p class="text-sm">West Walley City / UT / 84128</p>
        </li>
      </ol>
    </div>
    <div class="flex-none">
      <div class="dropdown dropdown-bottom dropdown-end">
        <div tabindex="0" role="button" class="btn m-1">Add️</div>
        <ul
          tabindex="0"
          class="dropdown-content menu bg-base-100 rounded-box z-1 w-70 p-2 shadow-sm text-base"
        >
          <li><a @click="selectedPickup = { id: -1 }">Pick Up</a></li>
          <li><a @click="selectedDelivery = { id: -1 }">Delivery</a></li>
          <li><a>Change of driver and vehicle</a></li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
