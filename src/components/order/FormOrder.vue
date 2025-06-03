<script setup lang="ts">
import { useStatusesNextStore } from '@/stores/statuses_next.ts'
import type { Order, OrderCreate, OrderUpdate } from '@/stores/orders.ts'

const props = defineProps<{
  id: number | null
}>()

const id = ref<number>()
const status = ref<number>()
const next_status = ref<number>()
const excluded = ref(false)
const number = ref('')
const dispatcher = ref<number>()
const posted_loads_id = ref('')
const refs = ref('')
const organization = ref<number>()
const broker = ref<number>()
const total_pieces = ref<number>()
const total_weight = ref<number>()
const total_miles = ref<number>()
const cost = ref<number>()
const driver_payment = ref<number>()
const driver = ref<number>()
const vehicle = ref<number>()

watch(
  () => props.id,
  (id) => {
    const record = ordersStore.resolve(id)
    resetAndShow(record)
  },
  { deep: true },
)

const ordersStore = useOrdersStore()
const nextStatusStore = useStatusesNextStore()

function resetAndShow(record: Order | null) {
  id.value = record?.id
  status.value = record ? { id: record.status } : null
  excluded.value = record?.excluded || false
  number.value = record?.number
  dispatcher.value = record ? { id: record.dispatcher } : null
  posted_loads_id.value = record?.posted_loads_id
  refs.value = record?.refs
  organization.value = record ? { id: record.organization } : null
  broker.value = record ? { id: orderRecord.broker } : null
  total_pieces.value = record?.total_pieces
  total_weight.value = record?.total_weight
  total_miles.value = record?.total_miles
  cost.value = record?.cost
  driver_payment.value = record?.driver_payment
  driver.value = record ? { id: record.driver } : null
  vehicle.value = record ? { id: record.vehicle } : null
}

async function saveOrder() {
  try {
    if (id.value == null) {
      await ordersStore.create({
        status: status.value?.id,
        next_status: next_status.value?.id,
        excluded: excluded.value,
        number: number.value,
        dispatcher: dispatcher.value?.id,
        posted_loads_id: posted_loads_id.value,
        refs: refs.value,
        organization: organization.value?.id,
        broker: broker.value?.id,
        total_pieces: total_pieces.value,
        total_weight: total_weight.value,
        total_miles: total_miles.value,
        cost: cost.value,
        driver_payment: driver_payment.value,
        driver: driver.value?.id,
        vehicle: vehicle.value?.id,
      } as OrderCreate)
    } else {
      ordersStore.update(id.value, {
        status: status.value?.id,
        next_status: next_status.value?.id,
        excluded: excluded.value,
        number: number.value,
        dispatcher: dispatcher.value?.id,
        posted_loads_id: posted_loads_id.value,
        refs: refs.value,
        organization: organization.value?.id,
        broker: broker.value?.id,
        total_pieces: total_pieces.value,
        total_weight: total_weight.value,
        total_miles: total_miles.value,
        cost: cost.value,
        driver_payment: driver_payment.value,
        driver: driver.value?.id,
        vehicle: vehicle.value?.id,
      } as OrderUpdate)
    }
    emit('closed')
  } catch (e) {
    console.log('error', e)
  }
}
</script>

<template>
  <form class="rounded-xl shadow-sm w-[90vw] md:w-[50vw] p-4">
    <div class="flex space-x-3 mb-2 w-full">
      <div class="md:w-1/2 md:mb-0">
        <TextInput disabled placeholder="Status" v-model="status" />
      </div>
      <div class="md:w-1/2 md:mb-0">
        <selector label="Next status" v-model="next_status" :store="nextStatusStore"></selector>
      </div>
      <div class="ml-auto">
        <label class="label mb-2">
          <Toggle v-model="excluded"></Toggle>
          <span class="ml-3 mr-3">excluded from calculation with dispatcher</span>
        </label>
      </div>
    </div>

    <div class="flex space-x-3 mb-2 mt-6 w-full">
      <div class="md:w-1/4 md:mb-0">
        <TextInput disabled placeholder="Number" v-model="number" />
      </div>
      <div class="md:w-1/4 md:mb-0">
        <TextInput disabled placeholder="Dispatcher" v-model="dispatcher" />
      </div>
      <div class="md:w-1/4 md:mb-0">
        <TextInput placeholder="Posted loads ID" v-model="posted_loads_id" />
      </div>
      <div class="md:w-1/4 md:mb-0">
        <TextInput placeholder="Refs" v-model="refs" />
      </div>
    </div>

    <div class="flex space-x-3 mb-2 mt-6 w-full">
      <div class="md:w-1/2 md:mb-0">
        <selector label="Organization" v-model="organization" :store="formStore"></selector>
      </div>
      <div class="md:w-1/2 md:mb-0">
        <selector label="Broker" v-model="broker" :store="formStore"></selector>
      </div>
    </div>

    <div class="flex space-x-3 mb-2 mt-6 w-full">
      <div class="md:w-1/5 md:mb-0">
        <TextInput placeholder="Total pieces" v-model="total_pieces" />
      </div>
      <div class="md:w-1/5 md:mb-0">
        <TextInput placeholder="Total weight" v-model="total_weight" />
      </div>
      <div class="md:w-1/5 md:mb-0">
        <TextInput placeholder="Total miles" v-model="total_miles" />
      </div>
      <div class="md:w-1/5 md:mb-0">
        <TextInput placeholder="Cost $" v-model="cost" />
      </div>
      <div class="md:w-1/5 md:mb-0">
        <TextInput disabled placeholder="Driver payment $" v-model="driver_payment" />
      </div>
    </div>

    <div class="flex space-x-3 mb-2 mt-6 w-full">
      <div class="md:w-1/3 md:mb-0">
        <TextInput disabled placeholder="Driver" v-model="driver" />
      </div>
      <div class="md:w-1/3 md:mb-0">
        <TextInput disabled placeholder="Vehicle" v-model="vehicle" />
      </div>
      <div class="md:w-1/4 md:mb-0">
        <TextInput disabled placeholder="Driver payment $" v-model="driver_payment" />
      </div>
      <Button>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="size-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"
          />
        </svg>
      </Button>
    </div>
  </form>
</template>

<style scoped></style>
