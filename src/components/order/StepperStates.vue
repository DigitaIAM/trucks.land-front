<script setup lang="ts">
import { useMagicKeys } from '@vueuse/core'
import type { OrderEvent } from '@/stores/order_events.ts'

const props = defineProps<{
  orderId: number | null
  disabled?: boolean
}>()

const emit = defineEmits(['on-update'])

const eventsStore = useEventsStore()
const driversStore = useDriversStore()
const vehiclesStore = useVehiclesStore()
const ownersStore = useOwnersStore()
const usersStore = useUsersStore()

watch(
  () => props.orderId,
  (id) => {
    // console.log('watch id', id, props.id)
    resetAndShow(id)
  },
  { deep: true },
)

resetAndShow(props.orderId)

function resetAndShow(id: number) {
  eventsStore.setOrderId(id)
}

function onUpdate() {
  resetAndShow(props.orderId)
  emit('on-update')
}

const selectedPickup = ref<OrderEvent | null>(null)
const selectedDelivery = ref<OrderEvent | null>(null)
const selectedChange = ref<OrderEvent | null>(null)
const selectedAgreement = ref<OrderEvent | null>(null)
const selectedExpenses = ref<OrderEvent | null>(null)

const keys = useMagicKeys()
const ctrlA = keys['Ctrl+A']
const ctrlP = keys['Ctrl+P']
const ctrlD = keys['Ctrl+D']

watch(ctrlA, (v) => {
  if (v) {
    selectedAgreement.value = <OrderEvent>{ id: -1, kind: 'agreement' }
  }
})

watch(ctrlP, (v) => {
  if (v) {
    selectedPickup.value = <OrderEvent>{ id: -1, kind: 'pick-up' }
  }
})

watch(ctrlD, (v) => {
  if (v) {
    selectedDelivery.value = <OrderEvent>{ id: -1, kind: 'delivery' }
  }
})

const handleKeyDown = (event) => {
  if (event.key === 'Escape') {
    console.log('Escape key pressed @ events')
    let stop = false

    if (selectedPickup.value) {
      selectedPickup.value = null
      stop = true
    }

    if (selectedDelivery.value) {
      selectedDelivery.value = null
      stop = true
    }

    if (selectedChange.value) {
      selectedChange.value = null
      stop = true
    }

    if (selectedAgreement.value) {
      selectedAgreement.value = null
      stop = true
    }

    if (selectedExpenses.value) {
      selectedExpenses.value = null
      stop = true
    }

    if (stop) {
      event.stopPropagation()
      event.preventDefault()
    } else {
      window.close()
    }
  }
}
useEventListener(document, 'keydown', handleKeyDown)

function selectPickup(data: OrderEvent) {
  selectedPickup.value = data
}

function selectDelivery(data: OrderEvent) {
  selectedDelivery.value = data
}

function selectChange(data: OrderEvent) {
  selectedChange.value = data
}

function selectAgreement(data: OrderEvent) {
  selectedAgreement.value = data
}

function selectExpenses(data: OrderEvent) {
  selectedExpenses.value = data
}

function checkIfPresent(listing: Array<OrderEvent>, kind: string): boolean {
  for (const event of listing) {
    if (event.kind === kind) {
      return true
    }
  }
  return false
}

const agreementPresent = computed(() => checkIfPresent(eventsStore.listing, 'agreement'))
const pickupPresent = computed(() => checkIfPresent(eventsStore.listing, 'pick-up'))
const deliveryPresent = computed(() => checkIfPresent(eventsStore.listing, 'delivery'))
</script>

<template>
  <PickUpModal
    :disabled="props.disabled"
    :document="props.orderId"
    :edit="selectedPickup"
    @on-update="onUpdate"
  />
  <DeliveryModal
    :disabled="props.disabled"
    :document="props.orderId"
    :edit="selectedDelivery"
    @on-update="onUpdate"
  />
  <ChangeDriverAndVehicle
    :disabled="props.disabled"
    :document="props.orderId"
    :edit="selectedChange"
    @on-update="onUpdate"
  />
  <AgreementModal
    :disabled="props.disabled"
    :document="props.orderId"
    :edit="selectedAgreement"
    @on-update="onUpdate"
  />
  <ExpensesModal
    :disabled="props.disabled"
    :document="props.orderId"
    :edit="selectedExpenses"
    @on-update="onUpdate"
  />

  <ol class="w-full relative text-gray-500 border-l-2 border-gray-500">
    <li class="mb-8 ms-6">
      <div class="absolute flex items-center justify-center w-8 h-8 rounded-full -start-4">
        <div class="dropdown dropdown-bottom dropdown-start">
          <div tabindex="0" role="button" class="btn rounded-full bg-accent-content">+</div>
          <ul
            tabindex="0"
            class="dropdown-content menu rounded-box z-1 w-70 p-2 shadow-sm text-base bg-accent-content"
          >
            <!--            <li>-->
            <!--              <div-->
            <!--                class="flex-row"-->
            <!--                @click="selectedPickup = <OrderEvent>{ id: -1, kind: 'pick-up' }"-->
            <!--              >-->
            <!--                <div class="text-white">Pick Up</div>-->
            <!--                <div />-->
            <!--                <kbd class="px-2 py-1.5 text-xs font-semibold text-heading bg-neutral-tertiary"-->
            <!--                  >ctrl + p</kbd-->
            <!--                >-->
            <!--              </div>-->
            <!--            </li>-->
            <!--            <li>-->
            <!--              <div-->
            <!--                class="flex-row"-->
            <!--                @click="selectedDelivery = <OrderEvent>{ id: -1, kind: 'delivery' }"-->
            <!--              >-->
            <!--                <div class="text-white">Delivery</div>-->
            <!--                <div />-->
            <!--                <kbd class="px-2 py-1.5 text-xs font-semibold text-heading bg-neutral-tertiary"-->
            <!--                  >ctrl + d</kbd-->
            <!--                >-->
            <!--              </div>-->
            <!--            </li>-->
            <!--            <li>-->
            <!--              <div-->
            <!--                class="flex-row"-->
            <!--                @click="selectedAgreement = <OrderEvent>{ id: -1, kind: 'agreement' }"-->
            <!--              >-->
            <!--                <div class="text-white">Agreement</div>-->
            <!--                <div />-->
            <!--                <kbd class="px-2 py-1.5 text-xs font-semibold text-heading bg-neutral-tertiary"-->
            <!--                  >ctrl + a</kbd-->
            <!--                >-->
            <!--              </div>-->
            <!--            </li>-->
            <li>
              <a class="text-white" @click="selectedChange = <OrderEvent>{ id: -1, kind: 'change' }"
                >Change of driver and vehicle</a
              >
            </li>
            <li>
              <a
                class="text-white"
                @click="selectedExpenses = <OrderEvent>{ id: -1, kind: 'expenses' }"
                >Expenses</a
              >
            </li>
          </ul>
        </div>
      </div>
      <span>&nbsp;</span>
    </li>

    <li class="mb-8 ms-6">
      <div
        class="cursor-pointer mb-8"
        @click="selectedAgreement = <OrderEvent>{ id: -1, kind: 'agreement' }"
        v-if="!agreementPresent"
      >
        <span
          class="absolute flex items-center justify-center w-8 h-8 rounded-full -start-4 bg-[#e35e87]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="white"
          >
            <path
              d="M471.54-161.15q5.92 0 12.04-2.77 6.11-2.77 9.65-6.31l319.92-319.92q13.54-13.54 20.39-28.93 6.84-15.38 6.84-32.3 0-17.54-6.84-33.77-6.85-16.24-20.39-29.16l-160-160q-12.92-13.54-28-19.81-15.07-6.26-32.61-6.26-16.92 0-32.5 6.26-15.58 6.27-28.73 19.81l-22.93 22.93 74 74.61q13.46 12.85 19.89 29.31 6.42 16.46 6.42 34.15 0 36.62-24.46 61.08t-61.08 24.46q-17.69 0-34.27-5.85-16.57-5.84-29.42-18.69l-75.77-75.15-173.84 173.84q-4.54 4.54-6.81 10.16-2.27 5.61-2.27 11.54 0 11.07 7.54 18.92 7.54 7.85 18.61 7.85 5.93 0 12.04-2.77 6.12-2.77 9.66-6.31L380-545.61l42.15 42.15-130.77 131.38q-4.53 4.54-6.8 10.16-2.27 5.61-2.27 11.54 0 10.69 7.73 18.42 7.73 7.73 18.42 7.73 5.93 0 12.04-2.77 6.12-2.77 9.65-6.31l136-135.38 42.16 42.15-135.39 136q-4.15 3.54-6.61 9.65-2.46 6.12-2.46 12.04 0 10.7 7.73 18.43t18.42 7.73q5.92 0 11.54-2.27 5.61-2.27 10.15-6.81l136-135.38L589.85-345l-136 136q-4.54 4.54-6.81 10.54-2.27 6-2.27 11.54 0 11.07 8.23 18.42 8.23 7.35 18.54 7.35Zm-.62 59.99q-33.92 0-59.15-23.53-25.23-23.54-26.38-58.62-34-2.31-56.81-24.15-22.81-21.85-24.73-57.39-35.54-2.3-57.46-24.84-21.93-22.54-23.47-56.7-35.69-2.3-58.92-25.88-23.23-23.58-23.23-59.65 0-17.69 6.73-34.66 6.73-16.96 19.58-29.8l216.61-216 117.16 117.15q3.53 4.15 9.26 6.62 5.74 2.46 12.43 2.46 10.92 0 18.84-7.23 7.93-7.23 7.93-18.93 0-6.69-2.46-12.42-2.47-5.73-6.62-9.27L399.92-774.31q-12.92-13.54-28.19-19.81-15.27-6.26-32.81-6.26-16.92 0-32.11 6.26-15.2 6.27-28.73 19.81l-131.39 132q-10.92 10.92-17.88 25.81-6.96 14.88-8.19 30.35-1.24 12.77 1.15 25.27 2.38 12.5 8.38 23.5L86-493.23Q72.46-512.77 65.62-537q-6.85-24.23-5.62-49.15 1.23-27.62 12.46-53.35t31.46-45.96l131-131q22.47-21.85 48.89-32.88 26.42-11.04 55.5-11.04 29.07 0 55.3 11.04 26.24 11.03 48.08 32.88l22.93 22.92 22.92-22.92q22.46-21.85 48.69-32.88 26.23-11.04 55.31-11.04 29.08 0 55.5 11.04 26.42 11.03 48.27 32.88l159 159q21.84 21.85 33.46 49.73 11.61 27.88 11.61 56.96 0 29.08-11.61 55.31-11.62 26.23-33.46 48.07L535.38-128.08q-13.23 13.23-29.8 20.08-16.58 6.84-34.66 6.84Zm-113.61-532.3Z"
            />
          </svg>
        </span>
        <Text class="font-bold text-[#e35e87] leading-tight">Agreement</Text>
        <kbd class="px-2 py-1.5 text-xs font-semibold text-heading bg-neutral-tertiary"
          >ctrl + a</kbd
        >
      </div>

      <div
        class="cursor-pointer mb-8"
        @click="selectedPickup = <OrderEvent>{ id: -1, kind: 'pick-up' }"
        v-if="!pickupPresent"
      >
        <span
          class="absolute flex items-center justify-center w-8 h-8 rounded-full -start-4 bg-[#68C3A8]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="white"
          >
            <path
              d="M117.7-128.47v-119.99h724.6v119.99h-95.38v-59.99H527.69v59.99h-95.38v-59.99H213.08v59.99H117.7Zm138.84-199.99q-15.37 0-25.76-10.4-10.39-10.39-10.39-25.76v-447.69q0-15.36 10.39-25.76 10.39-10.39 25.76-10.39h446.92q15.37 0 25.76 10.39 10.39 10.4 10.39 25.76v444.62q0 16.67-11.05 27.95-11.06 11.28-27.41 11.28H256.54Zm23.84-60h399.24v-400H280.38v400ZM360-636.92h240v-60H360v60Zm-79.62 248.46v-400 400Z"
            />
          </svg>
        </span>
        <text class="font-bold text-[#68C3A8] leading-tight">Pick up</text>
        <kbd class="px-2 py-1.5 text-xs font-semibold text-heading bg-neutral-tertiary"
          >ctrl + p</kbd
        >
      </div>

      <div
        class="cursor-pointer mb-8"
        @click="selectedDelivery = <OrderEvent>{ id: -1, kind: 'delivery' }"
        v-if="!deliveryPresent"
      >
        <span
          class="absolute flex items-center justify-center w-8 h-8 bg-[#388E3C] rounded-full -start-4"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="white"
          >
            <path
              d="M290-180q-45.77 0-77.88-32.12Q180-244.23 180-290H85.39l13.38-60h101.85q13.92-22.85 37.5-36.42Q261.69-400 290-400q28.31 0 51.89 13.58 23.57 13.57 37.5 36.42h175.84l85.93-370h-438l2.46-10.46q4.46-21.85 21.34-35.69Q243.85-780 266.69-780h449.46l-34.69 150h100.08l114.23 152.31L858.46-290h-63.08q0 45.77-32.11 77.88Q731.15-180 685.39-180q-45.77 0-77.89-32.12-32.11-32.11-32.11-77.88H400q0 45.77-32.12 77.88Q335.77-180 290-180Zm346.23-255h189.54l5.54-28.31L751.54-570h-83.85l-31.46 135Zm-.92-261.46 5.85-23.54-85.93 370 5.85-23.54 32.84-142.92 41.39-180ZM43.46-433.54l15-60h199.62l-15 60H43.46Zm80-142.92 15-60h239.62l-15 60H123.46ZM290-240q20.85 0 35.42-14.58Q340-269.15 340-290t-14.58-35.42Q310.85-340 290-340t-35.42 14.58Q240-310.85 240-290t14.58 35.42Q269.15-240 290-240Zm395.39 0q20.84 0 35.42-14.58 14.58-14.57 14.58-35.42t-14.58-35.42Q706.23-340 685.39-340q-20.85 0-35.43 14.58-14.58 14.57-14.58 35.42t14.58 35.42Q664.54-240 685.39-240Z"
            />
          </svg>
        </span>
        <text class="font-bold text-[#388E3C] leading-tight">Delivery</text>
        <kbd class="px-2 py-1.5 text-xs font-semibold text-heading bg-neutral-tertiary"
          >ctrl + d</kbd
        >
      </div>

      <template v-for="eventDate in eventsStore.listing" :key="eventDate.id">
        <div
          class="cursor-pointer mb-5"
          @click="selectDelivery(eventDate)"
          v-if="eventDate.kind == 'delivery'"
        >
          <span
            class="absolute flex items-center justify-center w-8 h-8 bg-[#388E3C] rounded-full -start-4"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="white"
            >
              <path
                d="M290-180q-45.77 0-77.88-32.12Q180-244.23 180-290H85.39l13.38-60h101.85q13.92-22.85 37.5-36.42Q261.69-400 290-400q28.31 0 51.89 13.58 23.57 13.57 37.5 36.42h175.84l85.93-370h-438l2.46-10.46q4.46-21.85 21.34-35.69Q243.85-780 266.69-780h449.46l-34.69 150h100.08l114.23 152.31L858.46-290h-63.08q0 45.77-32.11 77.88Q731.15-180 685.39-180q-45.77 0-77.89-32.12-32.11-32.11-32.11-77.88H400q0 45.77-32.12 77.88Q335.77-180 290-180Zm346.23-255h189.54l5.54-28.31L751.54-570h-83.85l-31.46 135Zm-.92-261.46 5.85-23.54-85.93 370 5.85-23.54 32.84-142.92 41.39-180ZM43.46-433.54l15-60h199.62l-15 60H43.46Zm80-142.92 15-60h239.62l-15 60H123.46ZM290-240q20.85 0 35.42-14.58Q340-269.15 340-290t-14.58-35.42Q310.85-340 290-340t-35.42 14.58Q240-310.85 240-290t14.58 35.42Q269.15-240 290-240Zm395.39 0q20.84 0 35.42-14.58 14.58-14.57 14.58-35.42t-14.58-35.42Q706.23-340 685.39-340q-20.85 0-35.43 14.58-14.58 14.57-14.58 35.42t14.58 35.42Q664.54-240 685.39-240Z"
              />
            </svg>
          </span>
          <h3 class="font-bold text-[#388E3C] leading-tight">Delivery</h3>
          <p class="text-md">
            {{ useDateFormat(eventDate.datetime, 'MMM DD, HH:mm') }}
          </p>
          <p class="text-md">{{ eventDate.city }} / {{ eventDate.state }} / {{ eventDate.zip }}</p>
          <p v-if="eventDate.address" class="text-md">{{ eventDate.address }}</p>
          <p v-if="eventDate.details.note" class="text-md">{{ eventDate.details.note }}</p>
        </div>

        <div
          class="cursor-pointer mb-5"
          @click="selectPickup(eventDate)"
          v-if="eventDate.kind == 'pick-up'"
        >
          <span
            class="absolute flex items-center justify-center w-8 h-8 rounded-full -start-4 bg-[#68C3A8]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="white"
            >
              <path
                d="M117.7-128.47v-119.99h724.6v119.99h-95.38v-59.99H527.69v59.99h-95.38v-59.99H213.08v59.99H117.7Zm138.84-199.99q-15.37 0-25.76-10.4-10.39-10.39-10.39-25.76v-447.69q0-15.36 10.39-25.76 10.39-10.39 25.76-10.39h446.92q15.37 0 25.76 10.39 10.39 10.4 10.39 25.76v444.62q0 16.67-11.05 27.95-11.06 11.28-27.41 11.28H256.54Zm23.84-60h399.24v-400H280.38v400ZM360-636.92h240v-60H360v60Zm-79.62 248.46v-400 400Z"
              />
            </svg>
          </span>
          <h3 class="font-bold text-[#68C3A8] leading-tight">Pick up</h3>
          <p class="text-md">{{ useDateFormat(eventDate.datetime, 'MMM DD, HH:mm') }}</p>
          <p class="text-md">{{ eventDate.city }} / {{ eventDate.state }} / {{ eventDate.zip }}</p>
          <p v-if="eventDate.address" class="text-md">{{ eventDate.address }}</p>
          <p v-if="eventDate.details.note" class="text-md">{{ eventDate.details.note }}</p>
        </div>

        <div
          class="cursor-pointer mb-5"
          @click="selectChange(eventDate)"
          v-if="eventDate.kind == 'change'"
        >
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
          <p class="text-md">{{ useDateFormat(eventDate.datetime, 'MMM DD, HH:mm') }}</p>
          <p class="text-md">
            <QueryAndShow :id="eventDate.driver" :store="driversStore" />
          </p>
          <p class="text-md">
            <QueryAndShow :id="eventDate.vehicle" :store="vehiclesStore" />
          </p>
          <p class="text-md">
            {{ eventDate.cost > 0 ? `\$${eventDate.cost}` : `${eventDate.percent}\%` }}
          </p>
          <p class="text-md">{{ eventDate.details.note }}</p>
        </div>
        <div
          class="cursor-pointer mb-5"
          @click="selectAgreement(eventDate)"
          v-if="eventDate.kind == 'agreement'"
        >
          <span
            class="absolute flex items-center justify-center w-8 h-8 rounded-full -start-4 bg-[#e35e87]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="white"
            >
              <path
                d="M471.54-161.15q5.92 0 12.04-2.77 6.11-2.77 9.65-6.31l319.92-319.92q13.54-13.54 20.39-28.93 6.84-15.38 6.84-32.3 0-17.54-6.84-33.77-6.85-16.24-20.39-29.16l-160-160q-12.92-13.54-28-19.81-15.07-6.26-32.61-6.26-16.92 0-32.5 6.26-15.58 6.27-28.73 19.81l-22.93 22.93 74 74.61q13.46 12.85 19.89 29.31 6.42 16.46 6.42 34.15 0 36.62-24.46 61.08t-61.08 24.46q-17.69 0-34.27-5.85-16.57-5.84-29.42-18.69l-75.77-75.15-173.84 173.84q-4.54 4.54-6.81 10.16-2.27 5.61-2.27 11.54 0 11.07 7.54 18.92 7.54 7.85 18.61 7.85 5.93 0 12.04-2.77 6.12-2.77 9.66-6.31L380-545.61l42.15 42.15-130.77 131.38q-4.53 4.54-6.8 10.16-2.27 5.61-2.27 11.54 0 10.69 7.73 18.42 7.73 7.73 18.42 7.73 5.93 0 12.04-2.77 6.12-2.77 9.65-6.31l136-135.38 42.16 42.15-135.39 136q-4.15 3.54-6.61 9.65-2.46 6.12-2.46 12.04 0 10.7 7.73 18.43t18.42 7.73q5.92 0 11.54-2.27 5.61-2.27 10.15-6.81l136-135.38L589.85-345l-136 136q-4.54 4.54-6.81 10.54-2.27 6-2.27 11.54 0 11.07 8.23 18.42 8.23 7.35 18.54 7.35Zm-.62 59.99q-33.92 0-59.15-23.53-25.23-23.54-26.38-58.62-34-2.31-56.81-24.15-22.81-21.85-24.73-57.39-35.54-2.3-57.46-24.84-21.93-22.54-23.47-56.7-35.69-2.3-58.92-25.88-23.23-23.58-23.23-59.65 0-17.69 6.73-34.66 6.73-16.96 19.58-29.8l216.61-216 117.16 117.15q3.53 4.15 9.26 6.62 5.74 2.46 12.43 2.46 10.92 0 18.84-7.23 7.93-7.23 7.93-18.93 0-6.69-2.46-12.42-2.47-5.73-6.62-9.27L399.92-774.31q-12.92-13.54-28.19-19.81-15.27-6.26-32.81-6.26-16.92 0-32.11 6.26-15.2 6.27-28.73 19.81l-131.39 132q-10.92 10.92-17.88 25.81-6.96 14.88-8.19 30.35-1.24 12.77 1.15 25.27 2.38 12.5 8.38 23.5L86-493.23Q72.46-512.77 65.62-537q-6.85-24.23-5.62-49.15 1.23-27.62 12.46-53.35t31.46-45.96l131-131q22.47-21.85 48.89-32.88 26.42-11.04 55.5-11.04 29.07 0 55.3 11.04 26.24 11.03 48.08 32.88l22.93 22.92 22.92-22.92q22.46-21.85 48.69-32.88 26.23-11.04 55.31-11.04 29.08 0 55.5 11.04 26.42 11.03 48.27 32.88l159 159q21.84 21.85 33.46 49.73 11.61 27.88 11.61 56.96 0 29.08-11.61 55.31-11.62 26.23-33.46 48.07L535.38-128.08q-13.23 13.23-29.8 20.08-16.58 6.84-34.66 6.84Zm-113.61-532.3Z"
              />
            </svg>
          </span>
          <h3 class="font-bold text-[#e35e87] leading-tight">Agreement</h3>
          <p class="text-md">{{ useDateFormat(eventDate.datetime, 'MMM DD, HH:mm') }}</p>
          <p v-if="eventDate.company" class="text-md">
            <QueryAndShow :id="eventDate.company" :store="ownersStore" />
          </p>
          <p v-if="eventDate.driver" class="text-md">
            <QueryAndShow :id="eventDate.driver" :store="driversStore" />
          </p>
          <p v-if="eventDate.vehicle" class="text-md">
            <QueryAndShow :id="eventDate.vehicle" :store="vehiclesStore" />
          </p>
          <p class="text-md">
            {{ eventDate.cost > 0 ? `\$${eventDate.cost}` : `${eventDate.percent}\%` }}
          </p>
          <p v-if="eventDate.details?.note" class="text-md">
            {{ eventDate.details?.note || '' }}
          </p>
          <p v-if="eventDate.vehicle_found_by" class="text-md max-sm:text-accent">
            <Text>vehicle found by:</Text>
            <QueryAndShow :id="eventDate.vehicle_found_by" :store="usersStore" />
          </p>
        </div>
        <div
          class="cursor-pointer mb-5"
          @click="selectExpenses(eventDate)"
          v-if="eventDate.kind == 'expenses'"
        >
          <span
            class="absolute flex items-center justify-center w-8 h-8 rounded-full -start-4 bg-[#60A5FA]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="white"
            >
              <path
                d="M240-100q-41.92 0-70.96-29.04Q140-158.08 140-199.82V-300h120v-552.31l55.39 47.7 56.15-47.7 56.15 47.7 56.16-47.7 56.15 47.7 56.15-47.7 56.16 47.7 56.15-47.7 56.15 47.7 55.39-47.7V-200q0 41.92-29.04 70.96Q761.92-100 720-100H240Zm480-60q17 0 28.5-11.5T760-200v-560H320v460h360v100q0 17 11.5 28.5T720-160ZM367.69-610v-60h226.92v60H367.69Zm0 120v-60h226.92v60H367.69Zm310-114.62q-14.69 0-25.04-10.34-10.34-10.35-10.34-25.04t10.34-25.04q10.35-10.34 25.04-10.34t25.04 10.34q10.35 10.35 10.35 25.04t-10.35 25.04q-10.35 10.34-25.04 10.34Zm0 120q-14.69 0-25.04-10.34-10.34-10.35-10.34-25.04t10.34-25.04q10.35-10.34 25.04-10.34t25.04 10.34q10.35 10.35 10.35 25.04t-10.35 25.04q-10.35 10.34-25.04 10.34ZM240-160h380v-80H200v40q0 17 11.5 28.5T240-160Zm-40 0v-80 80Z"
              />
            </svg>
          </span>
          <h3 class="font-bold text-[#60A5FA] leading-tight">Expenses</h3>
          <p class="text-md">${{ eventDate.cost }}</p>
          <p class="text-md">
            <QueryAndShow :id="eventDate.driver" :store="driversStore" />
          </p>
          <p class="text-md">
            <QueryAndShow :id="eventDate.vehicle" :store="vehiclesStore" />
          </p>
          <p class="text-md">{{ eventDate.details?.note || '' }}</p>
        </div>
      </template>
    </li>
  </ol>
</template>

<style scoped></style>
