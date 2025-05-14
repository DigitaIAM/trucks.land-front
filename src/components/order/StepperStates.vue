<script setup lang="ts">
import { ref } from 'vue'
import OrderStep from '@/components/modal/PickUpModal.vue'
import DropDownButton from '@/components/buttons/DropDownButton.vue'
// import OrderStep from '@/components/order/modal/DeliveryModal.vue'
// import OrderStep from '@/components/order/modal/ChangeDriverAndVehicle.vue'

const isModalOpened = ref(false)

const openModal = () => {
  console.log('openModal')
  isModalOpened.value = true
}

const closeModal = () => {
  isModalOpened.value = false
}

const submitHandler = () => {
  //here you do whatever
}
</script>

<template>
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
      <DropDownButton @pick-up="openModal"></DropDownButton>
      <!--      <DropDownButton @delivery="openModal"></DropDownButton>-->
      <!--      <button-->
      <!--        @click="openModal"-->
      <!--        class="w-16 h-10 grow-0 bg-[#313EC6] hover:bg-blue-500 text-white rounded-xl transition duration-300"-->
      <!--      >-->
      <!--        Add-->
      <!--      </button>-->
    </div>
    <OrderStep
      :isOpen="isModalOpened"
      @modal-close="closeModal"
      @submit="submitHandler"
      name="first-modal"
    >
    </OrderStep>
    <!--    <OrderStep-->
    <!--      :isOpen="isModalOpened"-->
    <!--      @modal-close="closeModal"-->
    <!--      @submit="submitHandler"-->
    <!--      name="second-modal"-->
    <!--    >-->
    <!--    </OrderStep>-->
  </div>
</template>

<style scoped></style>
