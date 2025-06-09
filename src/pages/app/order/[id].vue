<route lang="yaml">
meta:
layout: app
</route>

<script setup lang="ts">
import StepperUploading from '@/components/order/StepperUploading.vue'
import Comments from '@/components/order/Comments.vue'
import StepperStates from '@/components/order/StepperStates.vue'
import type { Broker } from '@/stores/brokers.ts'

const props = defineProps<{
  id: string
}>()

const _id = ref(null)
const status = ref(null)
const dispatcher = ref<User | Reference>()
const posted_loads = ref('')
const refs = ref('')
const organization = ref<Organization | Reference>()
const broker = ref<Broker | Reference>()
const total_pieces = ref<number>()
const total_weight = ref<number>()
const total_miles = ref<number>()
const cost = ref<number>()

const driver = ref('')
const vehicle = ref('')
const driver_payment = ref('')

const ordersStore = useOrdersStore()
const usersStore = useUsersStore()
const organizationsStore = useOrganizationsStore()
const brokersStore = useBrokersStore()
const statusesStore = useStatusesStore()
const nextStatusStore = useStatusesNextStore()

const next = computed(() => {
  // const ids = nextStatusStore.nextFor(status.value)
  // return Array.from(ids.map((id) => statusesStore.resolve(id)))
  return []
})

watch(
  () => props.id,
  (id) => {
    // console.log('watch id', id, props.id)
    resetAndShow(id)
  },
  { deep: true },
)

resetAndShow(props.id)

async function resetAndShow(str: string) {
  // console.log('resetAndShow', str, props.id, typeof str)

  const id = Number(str)

  const order = await ordersStore.resolve(id)
  // console.log('order', order)
  if (order) {
    // resetAndShow(order)
    _id.value = order.id
    status.value = { id: order.status }
    posted_loads.value = order.posted_loads
    dispatcher.value = { id: order.dispatcher }
    organization.value = { id: order.organization }
    broker.value = { id: order.broker }
    total_pieces.value = order.total_pieces
    refs.value = order.refs
    total_weight.value = order.total_weight
    total_miles.value = order.total_miles
    cost.value = order.cost
  } else {
    // TODO show error
  }

  // console.log('done', _id.value)
}

async function saveOrder(status: Status) {
  try {
    await ordersStore.update(_id.value, {
      status: status.id,
      dispatcher: dispatcher.value?.id,
      posted_loads: posted_loads.value,
      refs: refs.value,
      organization: organization.value?.id,
      broker: broker.value?.id,
      total_pieces: total_pieces.value,
      total_weight: total_weight.value,
      total_miles: total_miles.value,
      cost: cost.value,
    } as OrderUpdate)
  } catch (e) {
    console.log('error', e)
  }
}
</script>

<template>
  <div class="flex flex-col-2 mt-4 ml-4">
    <div class="flex flex-col w-full h-full">
      <div class="flex space-x-30 w-full">
        <div class="flex space-x-3 w-full">
          <!--          <Button v-for="status in next" :key="status.id" @click="saveOrder(status)">-->
          <!--            {{ status.name }}-->
          <!--          </Button>-->
          <Button v-for="id in next" :key="id">
            {{ statusesStore.resolve(id).name }}
          </Button>
        </div>
        <div class="flex-1/60 ml-16 mt-4">
          <StepperUploading :orderId="_id"></StepperUploading>
        </div>
      </div>

      <div class="flex mb-6 mt-6 w-full">
        <form class="rounded-xl shadow w-[90vw] md:w-[50vw] p-4">
          <div class="flex space-x-3 mb-2 mt-2 w-full">
            <div class="md:w-1/4 md:mb-0">
              <Label class="mb-1">Number</Label>
              <TextInput disabled :modelValue="_id" />
            </div>
            <div class="md:w-1/4 md:mb-0">
              <Label class="mb-1">Dispatcher</Label>
              <selector label="Dispatcher" v-model="dispatcher" :store="usersStore"></selector>
            </div>
            <div class="md:w-1/4 md:mb-0">
              <Label class="mb-1">Posted loads ID</Label>
              <TextInput v-model="posted_loads" />
            </div>
            <div class="md:w-1/4 md:mb-0">
              <Label class="mb-1">Refs</Label>
              <TextInput v-model="refs" />
            </div>
          </div>

          <div class="flex space-x-3 mb-2 mt-6 w-full">
            <div class="md:w-1/2 md:mb-0">
              <Label class="mb-1">Organization</Label>
              <selector
                label="Organization"
                v-model="organization"
                :store="organizationsStore"
              ></selector>
            </div>
            <div class="md:w-1/2 md:mb-0">
              <Label class="mb-1">Broker</Label>
              <selector label="Broker" v-model="broker" :store="brokersStore"></selector>
            </div>
          </div>

          <div class="flex space-x-3 mb-2 mt-6 w-full">
            <div class="md:w-1/4 md:mb-0">
              <Label class="mb-1">Total pieces</Label>
              <TextInput v-model="total_pieces" />
            </div>
            <div class="md:w-1/4 md:mb-0">
              <Label class="mb-1">Total weight</Label>
              <TextInput v-model="total_weight" />
            </div>
            <div class="md:w-1/4 md:mb-0">
              <Label class="mb-1">Total miles</Label>
              <TextInput v-model="total_miles" />
            </div>
            <div class="md:w-1/4 md:mb-0">
              <Label class="mb-1">Cost $</Label>
              <TextInput v-model="cost" />
            </div>
          </div>
          <div class="flex space-x-3 mb-2 mt-6 w-full">
            <div class="md:w-1/3 md:mb-0">
              <Label class="mb-1">Driver</Label>
              <TextInput v-model="driver" />
            </div>
            <div class="md:w-1/3 md:mb-0">
              <Label class="mb-1">Vehicle</Label>
              <TextInput v-model="vehicle" />
            </div>
            <div class="md:w-1/3 md:mb-0">
              <Label class="mb-1">Driver payment $</Label>
              <TextInput v-model="driver_payment" />
            </div>
          </div>
        </form>
      </div>
      <div class="w-full">
        <div class="px-2">
          <Comments></Comments>
        </div>
      </div>
    </div>

    <div class="w-full flex-col mt-16">
      <div class="px-20 mt-4">
        <StepperStates :orderId="_id"></StepperStates>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
