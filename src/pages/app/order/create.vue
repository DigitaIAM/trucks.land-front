<route lang="yaml">
meta:
layout: app
</route>

<script setup lang="ts">
const router = useRouter()

const props = defineProps<{
  edit: Order | null
}>()

const order_number = ref<number>()
const dispatcher = ref<User>()
const posted_loads = ref('')
const refs = ref('')
const organization = ref<Organization>()
const broker = ref<Broker>()
const total_pieces = ref<number>()
const total_weight = ref<number>()
const total_miles = ref<number>()
const cost = ref<number>()

const usersStore = useUsersStore()
const organizationsStore = useOrganizationsStore()
const brokersStore = useBrokersStore()
const ordersStore = useOrdersStore()
const statusesStore = useStatusesStore()
const nextStatusStore = useStatusesNextStore()

const next = computedAsync(async () => {
  const list = []

  const ids = nextStatusStore.nextFor(null)
  for (const idx in ids) {
    const id = ids[idx]
    const status = await statusesStore.resolve(id)
    list.push(status)
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

function resetAndShow(order: Order | null) {
  order_number.value = order?.id
  dispatcher.value = order ? { id: order.dispatcher } : null
  posted_loads.value = order?.posted_loads
  refs.value = order?.refs
  organization.value = order ? { id: order.organization } : null
  broker.value = order ? { id: order.broker } : null
  total_pieces.value = order?.total_pieces
  total_weight.value = order?.total_weight
  total_miles.value = order?.total_miles
  cost.value = order?.cost

  create_draft.showModal()
}

async function saveAndEdit(status: Status | null) {
  console.log('order_number', order_number)
  if (status == null) return
  try {
    const id = await ordersStore.create({
      status: status.id,
      order_number: order_number.value,
      dispatcher: dispatcher.value?.id,
      posted_loads: posted_loads.value,
      refs: refs.value,
      organization: organization.value?.id,
      broker: broker.value?.id,
      total_pieces: total_pieces.value,
      total_weight: total_weight.value,
      total_miles: total_miles.value,
      cost: cost.value,
    } as OrderCreate)
    create_draft.close()

    await router.replace({ path: '/app/order/' + id })
  } catch (e) {
    console.log('error', e)
    console.log('status', status.id)
  }
  emit('closed')
}
</script>

<template>
  <div class="flex flex-row gap-6 px-4 mb-2 mt-3">
    <Search></Search>
    <Button class="btn" @click="resetAndShow(null)">Create</Button>
  </div>
  <Modal id="create_draft">
    <ModalBox class="max-w-[calc(80vw-6.25rem)]">
      <Text semibold size="2xl">Order</Text>
      <div class="flex space-x-3 mb-2 mt-4 w-full">
        <div class="md:w-1/4 md:mb-0">
          <Label class="mb-1">Number</Label>
          <TextInput disabled v-model="order_number" />
        </div>
        <div class="md:w-1/4 md:mb-0">
          <Label class="mb-1">Dispatcher</Label>
          <selector v-model="dispatcher" :store="usersStore"></selector>
        </div>
        <div class="md:w-1/4 md:mb-0">
          <Label class="mb-1">Posted loads ID</Label>
          <TextInput v-model="posted_loads" label="Posted loads ID" />
        </div>
        <div class="md:w-1/4 md:mb-0">
          <Label class="mb-1">Refs</Label>
          <TextInput v-model="refs" label="Refs" />
        </div>
      </div>

      <div class="flex space-x-3 mb-2 mt-6 w-full">
        <div class="md:w-1/2 md:mb-0">
          <Label class="mb-1">Organization</Label>
          <selector v-model="organization" :store="organizationsStore"></selector>
        </div>
        <div class="md:w-1/2 md:mb-0">
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
          <Button v-for="status in next" :key="status?.id ?? -1" @click.stop="saveAndEdit(status)">
            Create as {{ status?.name }}
          </Button>
          <Button class="ml-6">Close</Button>
        </form>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
