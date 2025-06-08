<script setup lang="ts">
import { useEventsStore } from '@/stores/events.ts'

const props = defineProps<{
  orderId: number
}>()

const events = useEventsStore()

// const events = ref([
//   {
//     id: 1,
//     mode: 'delivery',
//     datetime: '15 Feb, 2025 11:00',
//     city: 'Saint Paul',
//     state: 'MN',
//     zip: '55121',
//   },
//   {
//     id: 2,
//     mode: 'change',
//     datetime: '12 Feb, 2025 15:00',
//     city: 'Saint Paul',
//     state: 'MN',
//     zip: '55121',
//     driver: 'Norval Forrester',
//     vehicle: 'V2909',
//     cost: '500',
//   },
//   {
//     id: 3,
//     mode: 'expenses',
//     datetime: '09 Feb, 2025 14:00',
//     driver: 'driver',
//     vehicle: 'vehicle',
//     cost: '56',
//     note: 'Сhange of tires',
//   },
//   {
//     id: 4,
//     mode: 'pick-up',
//     datetime: '10 Feb, 2025 20:00',
//     city: 'West Walley City',
//     state: 'UT',
//     zip: '84128',
//   },
//   {
//     id: 5,
//     mode: 'agreement',
//     datetime: '09 Feb, 2025 14:00',
//     driver: 'Norval Forrester',
//     vehicle: 'V2909',
//     cost: '1200',
//   },
// ])

// watch(
//   () => props.orderId,
//   (orderId) => {
//     useEventsStore()
//       .list(orderId)
//       .then((list) => (events.value = list))
//   },
//   { deep: true },
// )

const selectedPickup = ref(null)
const selectedDelivery = ref(null)
const selectedChange = ref(null)
const selectedAgreement = ref(null)
</script>

<template>
  <PickUpModal :order="props.orderId" :edit="selectedPickup"></PickUpModal>
  <DeliveryModal :order="props.orderId" :edit="selectedDelivery"></DeliveryModal>
  <ChangeDriverAndVehicle :order="props.orderId" :edit="selectedChange"></ChangeDriverAndVehicle>

  <div class="flex mb-2 w-full">
    <div class="grow">
      <ol class="relative text-gray-500 border-l-2 border-gray-500">
        <li class="mb-10 ms-6" v-for="event in events.listing" :key="event.id">
          <template v-if="event.kind == 'delivery'">
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
            <Text bold>Delivery</Text>
            <p class="text-md">{{ event.datetime }}</p>
            <p class="text-md">{{ event.city }} / {{ event.state }} / {{ event.zip }}</p>
          </template>
          <template v-if="event.kind == 'pick-up'">
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
            <p class="text-md">{{ event.datetime }}</p>
            <p class="text-md">{{ event.city }} / {{ event.state }} / {{ event.zip }}</p>
          </template>
          <template v-if="event.kind == 'change'">
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
            <p class="text-md">{{ event.datetime }}</p>
            <p class="text-md">{{ event.driver }}</p>
            <p class="text-md">{{ event.vehicle }}</p>
          </template>
          <template v-if="event.kind == 'agreement'">
            <span
              class="absolute flex items-center justify-center w-8 h-8 rounded-full -start-4 bg-[#e35e87]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#e3e3e3"
              >
                <path
                  d="M471.54-161.15q5.92 0 12.04-2.77 6.11-2.77 9.65-6.31l319.92-319.92q13.54-13.54 20.39-28.93 6.84-15.38 6.84-32.3 0-17.54-6.84-33.77-6.85-16.24-20.39-29.16l-160-160q-12.92-13.54-28-19.81-15.07-6.26-32.61-6.26-16.92 0-32.5 6.26-15.58 6.27-28.73 19.81l-22.93 22.93 74 74.61q13.46 12.85 19.89 29.31 6.42 16.46 6.42 34.15 0 36.62-24.46 61.08t-61.08 24.46q-17.69 0-34.27-5.85-16.57-5.84-29.42-18.69l-75.77-75.15-173.84 173.84q-4.54 4.54-6.81 10.16-2.27 5.61-2.27 11.54 0 11.07 7.54 18.92 7.54 7.85 18.61 7.85 5.93 0 12.04-2.77 6.12-2.77 9.66-6.31L380-545.61l42.15 42.15-130.77 131.38q-4.53 4.54-6.8 10.16-2.27 5.61-2.27 11.54 0 10.69 7.73 18.42 7.73 7.73 18.42 7.73 5.93 0 12.04-2.77 6.12-2.77 9.65-6.31l136-135.38 42.16 42.15-135.39 136q-4.15 3.54-6.61 9.65-2.46 6.12-2.46 12.04 0 10.7 7.73 18.43t18.42 7.73q5.92 0 11.54-2.27 5.61-2.27 10.15-6.81l136-135.38L589.85-345l-136 136q-4.54 4.54-6.81 10.54-2.27 6-2.27 11.54 0 11.07 8.23 18.42 8.23 7.35 18.54 7.35Zm-.62 59.99q-33.92 0-59.15-23.53-25.23-23.54-26.38-58.62-34-2.31-56.81-24.15-22.81-21.85-24.73-57.39-35.54-2.3-57.46-24.84-21.93-22.54-23.47-56.7-35.69-2.3-58.92-25.88-23.23-23.58-23.23-59.65 0-17.69 6.73-34.66 6.73-16.96 19.58-29.8l216.61-216 117.16 117.15q3.53 4.15 9.26 6.62 5.74 2.46 12.43 2.46 10.92 0 18.84-7.23 7.93-7.23 7.93-18.93 0-6.69-2.46-12.42-2.47-5.73-6.62-9.27L399.92-774.31q-12.92-13.54-28.19-19.81-15.27-6.26-32.81-6.26-16.92 0-32.11 6.26-15.2 6.27-28.73 19.81l-131.39 132q-10.92 10.92-17.88 25.81-6.96 14.88-8.19 30.35-1.24 12.77 1.15 25.27 2.38 12.5 8.38 23.5L86-493.23Q72.46-512.77 65.62-537q-6.85-24.23-5.62-49.15 1.23-27.62 12.46-53.35t31.46-45.96l131-131q22.47-21.85 48.89-32.88 26.42-11.04 55.5-11.04 29.07 0 55.3 11.04 26.24 11.03 48.08 32.88l22.93 22.92 22.92-22.92q22.46-21.85 48.69-32.88 26.23-11.04 55.31-11.04 29.08 0 55.5 11.04 26.42 11.03 48.27 32.88l159 159q21.84 21.85 33.46 49.73 11.61 27.88 11.61 56.96 0 29.08-11.61 55.31-11.62 26.23-33.46 48.07L535.38-128.08q-13.23 13.23-29.8 20.08-16.58 6.84-34.66 6.84Zm-113.61-532.3Z"
                />
              </svg>
            </span>
            <h3 class="font-bold text-[#e35e87] leading-tight">Agreement</h3>
            <p class="text-md">{{ event.driver }}</p>
            <p class="text-md">{{ event.vehicle }}</p>
            <p class="text-md">${{ event.cost }}</p>
          </template>
          <template v-if="event.kind == 'expenses'">
            <span
              class="absolute flex items-center justify-center w-8 h-8 rounded-full -start-4 bg-[#60A5FA]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#e3e3e3"
              >
                <path
                  d="M240-100q-41.92 0-70.96-29.04Q140-158.08 140-199.82V-300h120v-552.31l55.39 47.7 56.15-47.7 56.15 47.7 56.16-47.7 56.15 47.7 56.15-47.7 56.16 47.7 56.15-47.7 56.15 47.7 55.39-47.7V-200q0 41.92-29.04 70.96Q761.92-100 720-100H240Zm480-60q17 0 28.5-11.5T760-200v-560H320v460h360v100q0 17 11.5 28.5T720-160ZM367.69-610v-60h226.92v60H367.69Zm0 120v-60h226.92v60H367.69Zm310-114.62q-14.69 0-25.04-10.34-10.34-10.35-10.34-25.04t10.34-25.04q10.35-10.34 25.04-10.34t25.04 10.34q10.35 10.35 10.35 25.04t-10.35 25.04q-10.35 10.34-25.04 10.34Zm0 120q-14.69 0-25.04-10.34-10.34-10.35-10.34-25.04t10.34-25.04q10.35-10.34 25.04-10.34t25.04 10.34q10.35 10.35 10.35 25.04t-10.35 25.04q-10.35 10.34-25.04 10.34ZM240-160h380v-80H200v40q0 17 11.5 28.5T240-160Zm-40 0v-80 80Z"
                />
              </svg>
            </span>
            <h3 class="font-bold text-[#60A5FA] leading-tight">Expenses</h3>
            <p class="text-md">{{ event.details }}</p>
            <p class="text-md">{{ event.datetime }}</p>
            <p class="text-md">${{ event.cost }}</p>
          </template>
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
          <li><a @click="selectedAgreement = { id: -1, kind: 'agreement' }">Agreement</a></li>
          <li><a @click="selectedPickup = { id: -1, kind: 'pick-up' }">Pick Up</a></li>
          <li>
            <a @click="selectedChange = { id: -1, kind: 'change' }">Change of driver and vehicle</a>
          </li>
          <li><a>Expenses</a></li>
          <li><a @click="selectedDelivery = { id: -1, kind: 'delivery' }">Delivery</a></li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
