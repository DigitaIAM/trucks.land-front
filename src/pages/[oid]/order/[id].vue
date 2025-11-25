<route lang="yaml">
# @formatter:off
meta:
  layout: order-view
</route>

<script lang="ts">
import { defineBasicLoader } from 'unplugin-vue-router/data-loaders/basic'

const organizationsStore = useOrganizationsStore()
const authStore = useAuthStore()

export const useOrgData = defineBasicLoader(
  'oid',
  async (route) => {
    const org = await organizationsStore.resolve3(route.params.oid)
    authStore.org = org
    return org
  },
  { key: 'org' },
)
</script>

<script setup lang="ts">
defineOptions({
  __loaders: [useOrgData],
})


const _order = ref<Order | null>(null)
const _id = ref<number | null>(null)
const docnum = ref<number | null>(null)
const created_by = ref<User | Reference>()
const vehicle_found = ref<User>()
const posted_loads = ref('')
const refs = ref('')
const broker = ref<Broker | Reference>()
const total_pieces = ref<number>()
const total_weight = ref<number>()
const total_miles = ref<number>()
const cost = ref<number>()
const excluded = ref(false)

const authStore = useAuthStore()
const ordersStore = useOrdersStore()
const usersStore = useUsersStore()
const brokersStore = useBrokersStore()
const statusesStore = useStatusesStore()
const nextStatusStore = useStatusesNextStore()

const currentAccount = computedAsync(async () => {
  return await usersStore.resolveUUID(authStore.org?.id, authStore.user?.id)
}, null)

const isReadOnly = computedAsync(async () => {
  const account = currentAccount.value;
  if (account && account.access) {
    for (const record of account.access) {
      if (record.is_admin) {
        return false
      } else if (record.is_dispatcher) {
        const id = created_by.value?.id;
        if (id && id === created_by.value) {
          return false
        }
      }

    }
  }
  return true
}, true)

const nextStatuses = computedAsync(async () => {
  const list = [] as List<Status>

  const order = _order.value
  if (order) {
    const ids = nextStatusStore.nextFor(order.stage)
    for (const idx in ids) {
      const id = ids[idx]
      const status = await statusesStore.resolve(id)
      list.push(status)
    }
  }

  return list
}, [] as List<Status>)

const currentStatus = computedAsync(async () => {
  return await statusesStore.resolve(_order.value?.stage)
}, {})

const route = useRoute()

watch(
  () => route.params.id,
  (id) => {
    // console.log('watch id', id, props.id)
    resetAndShow(id)
  },
  { deep: true },
)

resetAndShow(route.params.id)

async function resetAndShow(str: string) {
  // console.log('resetAndShow', str, props.id, typeof str)

  const id = Number(str)

  const order = await ordersStore.resolve(id)
  // console.log('order', order)
  if (order) {
    // resetAndShow(order)
    _order.value = order
    _id.value = order.id
    docnum.value = order.number
    posted_loads.value = order.posted_loads
    created_by.value = { id: order.created_by }
    vehicle_found.value = { id: order.vehicle_found }
    broker.value = { id: order.broker }
    total_pieces.value = order.total_pieces
    refs.value = order.refs
    total_weight.value = order.total_weight
    total_miles.value = order.total_miles
    cost.value = order.cost
    excluded.value = order.excluded
  } else {
    // TODO show error
  }
}

async function saveOrder(next: Status | null | undefined) {
  try {
    const order = _order.value
    if (order) {
      if (
        order.posted_loads != posted_loads.value ||
        order.refs != refs.value ||
        order.vehicle_found != order.vehicle_found?.id ||
        order.broker != broker.value?.id ||
        order.total_pieces != total_pieces.value ||
        order.total_weight != total_weight.value ||
        order.total_miles != total_miles.value ||
        order.cost != cost.value ||
        order.excluded != excluded.value
      ) {
        await ordersStore.update(order.id, {
          posted_loads: posted_loads.value,
          refs: refs.value,
          broker: broker.value?.id,
          vehicle_found: vehicle_found.value?.id,
          total_pieces: total_pieces.value,
          total_weight: total_weight.value,
          total_miles: total_miles.value,
          cost: cost.value,
          excluded: excluded.value,
        } as OrderUpdate)
      }

      if (next) {
        await ordersStore.changeStatus(order, next)
        // await router.replace({ path: '/' + org.code3.toLowerCase() + '/order/all' })
      }
      closeOrder()
    }
  } catch (e) {
    console.log('error', e)
  }
}

function handleClick() {
  excluded.value = !excluded.value
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
  <div class="flex flex-col-3 px-6">
    <div class="flex flex-col w-full h-full">
      <div class="flex w-full space-x-6">
        <div class="flex space-x-3 w-full">
          <Button class="btn-soft font-light tracking-wider" @click="closeOrder()">Close</Button>
          <Button class="btn-soft font-light tracking-wider" @click="saveOrder(null)" v-if="!isReadOnly"
            >Update
          </Button>
        </div>
        <Button
          ghost
          class="cursor-pointer btn-soft font-light tracking-wider"
          :class="{ 'exclude-active': excluded }"
          @click="handleClick"
          :disabled="isReadOnly"
          >excluded from calculations with the dispatcher
        </Button>
      </div>

      <div class="flex w-full h-full mt-6">
        <div class="flex space-x-3 w-full">
          <Button
            disabled
            :style="'background-color: ' + (currentStatus?.color ?? '#333333')"
            class="btn-soft font-light tracking-wider text-white"
            >{{ currentStatus?.name }}
          </Button>
          <Text class="mt-2" v-if="nextStatuses.length != 0">change to</Text>
          <Button
            v-for="next in nextStatuses"
            :key="next?.id"
            @click="saveOrder(next)"
            :style="'background-color: ' + (next?.color ?? '#333333')"
            class="btn-soft font-light tracking-wider text-white"
          >
            {{ next.name }}
          </Button>
        </div>
      </div>

      <div class="flex w-full mt-10">
        <form class="w-[90vw] md:w-[50vw]">
          <div class="flex space-x-3 mb-2 mt-2 w-full">
            <div class="md:w-1/3 md:mb-0">
              <Label class="mb-1">Number</Label>
              <TextInput disabled :modelValue="docnum" />
            </div>
            <div class="md:w-1/3 md:mb-0">
              <Label class="mb-1">Posted loads ID</Label>
              <TextInput v-model="posted_loads" :disabled="isReadOnly"/>
            </div>
            <div class="md:w-1/3 md:mb-0">
              <Label class="mb-1">Refs</Label>
              <TextInput v-model="refs" :disabled="isReadOnly"/>
            </div>
          </div>

          <div class="flex space-x-3 mb-2 mt-6 w-full">
            <div class="md:w-1/2 md:mb-0">
              <Label class="mb-1">Dispatcher</Label>
              <selector
                disabled
                label="Dispatcher"
                v-model="created_by"
                :store="usersStore"
              ></selector>
            </div>
            <div class="md:w-1/2 md:mb-0">
              <Label class="mb-1">Broker</Label>
              <selector label="Broker" v-model="broker" :store="brokersStore" :disabled="isReadOnly"></selector>
            </div>
          </div>

          <div class="flex space-x-3 mb-2 mt-6 w-full">
            <div class="md:w-1/4 md:mb-0">
              <Label class="mb-1">Total pieces</Label>
              <TextInput v-model="total_pieces" :disabled="isReadOnly"/>
            </div>
            <div class="md:w-1/4 md:mb-0">
              <Label class="mb-1">Total weight</Label>
              <TextInput v-model="total_weight" :disabled="isReadOnly"/>
            </div>
            <div class="md:w-1/4 md:mb-0">
              <Label class="mb-1">Total miles</Label>
              <TextInput v-model="total_miles" :disabled="isReadOnly"/>
            </div>
            <div class="md:w-1/4 md:mb-0">
              <Label class="mb-1">Cost $</Label>
              <TextInput v-model="cost" :disabled="isReadOnly"/>
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
        <StepperStates :orderId="_id" :disabled="isReadOnly"></StepperStates>
      </div>
    </div>
    <StepperUploading :order="_order"></StepperUploading>
  </div>
</template>

<style scoped>
.exclude-active {
  background-color: red;
}
</style>
