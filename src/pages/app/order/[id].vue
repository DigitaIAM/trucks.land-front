<route lang="yaml">
meta:
layout: app
</route>

<script setup lang="ts">
const router = useRouter()

import StepperUploading from '@/components/order/StepperUploading.vue'
import Comments from '@/components/order/Comments.vue'
import StepperStates from '@/components/order/StepperStates.vue'
import type { Broker } from '@/stores/brokers.ts'
import DriverAndVehicle from '@/components/order/DriverAndVehicle.vue'

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

const ordersStore = useOrdersStore()
const usersStore = useUsersStore()
const organizationsStore = useOrganizationsStore()
const brokersStore = useBrokersStore()
const statusesStore = useStatusesStore()
const nextStatusStore = useStatusesNextStore()

const nexts = computedAsync(async () => {
  const list = []

  const ids = nextStatusStore.nextFor(status.value)
  for (const idx in ids) {
    const id = ids[idx]
    const status = await statusesStore.resolve(id)
    list.push(status)
  }

  return list
}, [])

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

async function saveOrder(next: Status | null) {
  try {
    await ordersStore.update(_id.value, {
      status: next?.id ?? status.value.id,
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

    await router.replace({ path: '/app/order/all' })
  } catch (e) {
    console.log('error', e)
  }
}

function closeOrder() {
  window.close()
}

const handleKeyDown = (event) => {
  if (event.key === 'Escape') {
    console.log('Escape key pressed!')
    closeOrder()
  }
}
useEventListener(document, 'keydown', handleKeyDown)
</script>

<template>
  <div class="flex flex-col-2 mt-10 ml-4">
    <div class="flex flex-col w-full h-full">
      <div class="flex w-full">
        <div class="flex space-x-3 w-full">
          <Button @click="closeOrder()">Close</Button>
          <Button @click="saveOrder(null)">Update</Button>
          <Text class="mt-2">or change to</Text>
          <Button
            v-for="next in nexts"
            :key="id"
            @click="saveOrder(next)"
            :style="'background-color: ' + next.color"
          >
            {{ next.name }}
          </Button>
        </div>
        <StepperUploading :orderId="_id"></StepperUploading>
      </div>

      <div class="flex w-full mt-10">
        <form class="w-[90vw] md:w-[50vw]">
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
          <div class="mb-6">
            <DriverAndVehicle :orderId="_id" />
          </div>
        </form>
      </div>
      <div class="w-full mt-4">
        <Comments :orderId="_id"></Comments>
      </div>
    </div>

    <div class="w-full flex-col">
      <div class="px-20 mt-1">
        <StepperStates :orderId="_id"></StepperStates>
      </div>
      <div class="place-self-end mr-20">
        <Button>Create invoice</Button>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
