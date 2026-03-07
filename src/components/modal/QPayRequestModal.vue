<script setup lang="ts">
const props = defineProps<{
  document: Order | null
}>()

const id = ref<number | null>(null)
const owner = ref<Owner | null | undefined>()
const amount = ref<number | null>(null)
const note = ref<string>('')
const qpay = ref(false)

const emit = defineEmits(['closed'])

const errorMsg = ref<string | null>(null)

watch(
  () => props.document,
  (id) => {
    resetAndShow(id)
  },
  { deep: true },
)

const quickPaysStore = useQuickPaysStore()
const statusesStore = useStatusesStore()
const nextStatusStore = useStatusesNextStore()
const authStore = useAuthStore()
const usersStore = useUsersStore()
const ownerStore = useOwnersStore()

const next = computedAsync(async () => {
  const list = []

  const ids = nextStatusStore.nextFor('qpay', undefined)
  for (const idx in ids) {
    const id = ids[idx]
    const stage = await statusesStore.resolve(id)
    list.push(stage)
  }

  return list
}, [])

async function resetAndShow() {
  // console.log('resetAndShow', props.document)
  console.log('qpay', qpay.value)
  amount.value = props.document?.driver_cost
  owner.value = await ownerStore.resolve(props.document?.owner)
}

function saveQP(stage: Status | null) {
  try {
    if (id.value == null) {
      quickPaysStore.create(
        {
          organization: authStore.oid,
          order: props.document?.id,
          owner: props.document?.owner,
          driver: props.document?.driver,
          vehicle: props.document?.vehicle,
          amount: amount.value,
          note: note.value,
          qpay: qpay.value,
        } as QuickPaysCreate,
        stage,
      )
    }
    create_qpay.close()
  } catch (e) {
    errorMsg.value = e
    console.log('error', e)
    console.log('stage', stage)
  }
  emit('closed')
  console.log('saveQP qpay', qpay.value)
}

function handleClick() {
  create_qpay.showModal()
  qpay.value = true
}
</script>

<template>
  <Button
    class="btn-soft font-light tracking-wider"
    @click="handleClick"
    :class="{ 'qpay-active': qpay }"
    >Quick pay
  </Button>
  <Modal id="create_qpay">
    <ModalBox class="max-w-[calc(50vw)]">
      <div class="grid grid-cols-2">
        <div>
          <Text semibold size="xl">Quick payment request</Text>
          <Label class="px-3">created by</Label>
          <QueryAndShow :id="authStore.account?.id" :store="usersStore" />
        </div>
        <div class="mb-2 place-self-end">
          {{ authStore.org?.name }}
        </div>
      </div>
      <div class="flex space-x-3 mt-2 w-full">
        <div class="md:w-2/3 md:mb-0">
          <Label class="mt-2">Note</Label>
          <TextInput class="w-full" v-model="note" />
        </div>
        <div class="md:w-1/3 md:mb-0">
          <Label class="mt-2">Amount $</Label>
          <TextInput v-model="amount" class="w-full" />
        </div>
      </div>
      <div class="flex space-x-3 mt-4 w-full">
        <div class="md:w-1/3 md:mb-0">
          <Label class="mt-2">Order number</Label>
          <TextInput disabled :modelValue="props.document?.number" class="w-full" />
        </div>
        <div class="md:w-2/3 md:mb-0">
          <Label class="mt-2">Owner</Label>
          <TextInput disabled :modelValue="owner?.name" class="w-full" />
        </div>
      </div>
      <div class="mb-4">
        <DriverAndVehicle :orderId="props.document?.id" />
      </div>
      <ModalAction>
        <form method="dialog">
          <Button
            class="btn-soft font-light tracking-wider"
            v-for="stage in next"
            :key="stage?.id ?? -1"
            @click="saveQP(stage)"
          >
            <span v-if="id > 0">Update</span><span v-else>{{ stage?.name }}</span>
          </Button>
          <Button class="btn-soft font-light tracking-wider ml-6">Close</Button>
        </form>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped>
.qpay-active {
  background-color: #0269d1;
}
</style>
