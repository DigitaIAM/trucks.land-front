<script setup lang="ts">
import type { QuickPayCreate } from '@/stores/quick_pays.ts'

const props = defineProps<{
  document: Order | null
}>()

const id = ref<number | null>(null)
const owner = ref<Owner | undefined>()
const amount = ref<number | undefined>()
const note = ref<string>('')

const isOpen = ref(false)
const isReadOnly = ref(false)

const emit = defineEmits(['create', 'closed'])

const errorMsg = ref<string | null>(null)

watch(
  () => props.document,
  (doc) => {
    resetAndShow(doc)
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

async function resetAndShow(doc: Order | null) {
  // console.log('resetAndShow', props.document)
  isReadOnly.value = false
  if (doc) {
    if (doc.qp_id) {
      isReadOnly.value = true
      amount.value = doc.qp_amount
      owner.value = await ownerStore.resolve(doc.qp_owner)
    } else {
      amount.value = props.document?.driver_cost
      owner.value = await ownerStore.resolve(doc?.owner)
    }
  }
}

async function saveQP(stage: Status | null) {
  if (props.document && props.document.qp_id) {
    // do nothing if exist
    return
  }
  try {
    if (id.value == null) {
      const qpay = await quickPaysStore.create(
        {
          organization: authStore.oid,
          document: props.document?.id,
          owner: props.document?.owner,
          driver: props.document?.driver,
          vehicle: props.document?.vehicle,
          amount: amount.value,
          note: note.value,
        } as QuickPayCreate,
        stage,
      )

      emit('create', qpay)
    }
    handleClose()
  } catch (e) {
    errorMsg.value = e
    console.log('error', e)
    console.log('stage', stage)
  }
  emit('closed')
}

const handleKeyDown = (event) => {
  if (event.key === 'Escape' && isOpen.value) {
    event.stopPropagation()
    event.preventDefault()
    event.stopImmediatePropagation()

    handleClose()
  }
}
useEventListener(document, 'keydown', handleKeyDown)

function handleClick() {
  isOpen.value = true
  create_qpay.showModal()
}

function handleClose() {
  isOpen.value = false
  create_qpay.close()
}
</script>

<template>
  <Button
    class="btn-soft font-light tracking-wider"
    :class="{ 'qpay-active': isReadOnly }"
    @click="handleClick"
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
          <TextInput class="w-full" v-model="note" :disabled="isReadOnly" />
        </div>
        <div class="md:w-1/3 md:mb-0">
          <Label class="mt-2">Amount $</Label>
          <TextInput v-model="amount" class="w-full" :disabled="isReadOnly" />
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
        <template v-if="!isReadOnly">
          <Button
            class="btn-soft font-light tracking-wider"
            v-for="stage in next"
            :key="stage?.id ?? -1"
            @click="saveQP(stage)"
          >
            {{ stage?.name }}
          </Button>
        </template>
        <Button class="btn-soft font-light tracking-wider ml-6" @click="handleClose()"
          >Close
        </Button>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped>
.qpay-active {
  background-color: #0269d1;
}
</style>
