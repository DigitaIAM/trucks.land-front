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

const cOrg = useOrgData()

const props = defineProps<{
  edit: Order | null
}>()

const docnum = ref<number>()
const created_by = ref<User>()
const vehicle_found = ref<User | null>(null)
const posted_loads = ref('')
const refs = ref('')

const broker = ref<Broker>()
const total_pieces = ref<number>()
const total_weight = ref<number>()
const total_miles = ref<number>()
const cost = ref<number>()

const authStore = useAuthStore()
const usersStore = useUsersStore()

const brokersStore = useBrokersStore()
const ordersStore = useOrdersStore()
const statusesStore = useStatusesStore()
const nextStatusStore = useStatusesNextStore()

const next = computedAsync(async () => {
  const list = []

  const ids = nextStatusStore.nextFor(null)
  for (const idx in ids) {
    const id = ids[idx]
    const stage = await statusesStore.resolve(id)
    list.push(stage)
  }

  return list
}, [])

const emit = defineEmits(['closed'])

watch(
  () => props.edit,
  (order) => {
    resetAndShow(order)
  },
  { deep: true },
)

async function resetAndShow(order: Order | null) {
  const account = await authStore.currentAccount()

  docnum.value = order?.number
  created_by.value = order ? { id: order.created_by } : account ? { id: account.id } : null
  vehicle_found.value = order && order.vehicle_found ? { id: order.vehicle_found } : null
  posted_loads.value = order?.posted_loads
  refs.value = order?.refs
  broker.value = order && order.broker ? { id: order.broker } : null
  total_pieces.value = order?.total_pieces
  total_weight.value = order?.total_weight
  total_miles.value = order?.total_miles
  cost.value = order?.cost

  create_draft.showModal()
}

function openOrder(order: Order, org: Organization) {
  window.open('/' + org.code3.toLowerCase() + '/order/' + order.id, '_blank')
  // console.log('org.code3', orgData.data.value.code3)
}

async function saveAndEdit(stage: Status | null) {
  if (stage == null) return

  try {
    const org = cOrg.data.value
    const order = await ordersStore.create(
      {
        organization: org.id,
        created_by: created_by.value?.id,
        vehicle_found: vehicle_found.value?.id,
        posted_loads: posted_loads.value,
        refs: refs.value,
        broker: broker.value?.id,
        total_pieces: total_pieces.value,
        total_weight: total_weight.value,
        total_miles: total_miles.value,
        cost: cost.value,
        excluded: false,
      } as OrderCreate,
      stage,
    )
    create_draft.close()

    openOrder(order, org)
    // await router.replace({ path: '/' + org.code3.toLowerCase() + '/order/' + id })
  } catch (e) {
    console.log('error', e)
    console.log('stage', stage.id)
  }
  emit('closed')
}
</script>

<template>
  <Button class="btn-soft font-light tracking-wider" @click="resetAndShow(null)">Create</Button>
  <Modal id="create_draft">
    <ModalBox class="max-w-[calc(60vw-6.25rem)]">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <Text semibold size="2xl">New order</Text>
        </div>
        <div class="mb-4 place-self-end">
          <Text semibold size="2xl">{{ cOrg.data.value?.name }}</Text>
        </div>
      </div>
      <div class="flex space-x-3 mb-2 mt-4 w-full">
        <div class="md:w-1/3 md:mb-0">
          <Label class="mb-1">Number</Label>
          <TextInput disabled v-model="docnum" />
        </div>
        <div class="md:w-1/3 md:mb-0">
          <Label class="mb-1">Posted loads ID</Label>
          <TextInput v-model="posted_loads" />
        </div>
        <div class="md:w-1/3 md:mb-0">
          <Label class="mb-1">Refs</Label>
          <TextInput v-model="refs" label="Refs" />
        </div>
      </div>

      <div class="flex space-x-3 mb-2 mt-6 w-full">
        <div class="md:w-1/3 md:mb-0">
          <Label class="mb-1">Dispatcher</Label>
          <selector :modelValue="created_by" :store="usersStore" disabled />
        </div>
        <div class="md:w-1/3 md:mb-0">
          <Label class="mb-1">Vehicle was found</Label>
          <selector :modelValue="vehicle_found" :store="usersStore" />
        </div>
        <div class="md:w-1/3 md:mb-0">
          <Label class="mb-1">Broker</Label>
          <selector v-model="broker" :store="brokersStore"></selector>
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

      <ModalAction>
        <form method="dialog">
          <Button
            class="btn-soft font-light tracking-wider"
            v-for="stage in next"
            :key="stage?.id ?? -1"
            @click.stop="saveAndEdit(stage)"
          >
            Create as {{ stage?.name }}
          </Button>
          <Button class="btn-soft font-light tracking-wider ml-6">Close</Button>
        </form>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
