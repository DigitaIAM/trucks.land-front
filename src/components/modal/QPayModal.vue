<script setup lang="ts">
import type { OrderAndQuickPay } from '@/stores/quick_pays.ts'

const ownerStore = useOwnersStore()
const usersStore = useUsersStore()
const organizationsStore = useOrganizationsStore()
const driversStore = useDriversStore()
const vehiclesStore = useVehiclesStore()
const qpayStore = useQuickPaysStore()
const statusesStore = useStatusesStore()
const nextStatusStore = useStatusesNextStore()

const props = defineProps<{
  document: OrderAndQuickPay | null
}>()

const order = ref<Order | null | undefined>()
const owner = ref<Owner | null | undefined>()

const amount = ref<number>()
const note = ref<string>()

const emit = defineEmits(['closed'])

watch(
  () => props.document,
  (doc) => {
    resetAndShow(doc)
  },
  { deep: true },
)

async function resetAndShow(qpay: OrderAndQuickPay | null) {
  if (qpay) {
    order.value = qpay as Order
    owner.value = await ownerStore.resolve(qpay.qp_owner)
    amount.value = qpay.qp_amount
    note.value = qpay.qp_note
    qpay_modal.showModal()
  } else {
    emit('closed')
    qpay_modal.close()
  }
}

const nextStatuses = computedAsync(async () => {
  const list = [] as List<Status>

  const qpay = props.document
  if (qpay) {
    const ids = nextStatusStore.nextFor('qpay', qpay.qp_stage)
    for (const idx in ids) {
      const id = ids[idx]
      const status = await statusesStore.resolve(id)
      list.push(status)
    }
  }

  return list
}, [] as List<Status>)

async function changeStatus(next: Status | null | undefined) {
  const doc = props.document
  if (doc && next) {
    await qpayStore.changeStatus(doc.qp_id, next)
    qpay_modal.close()
  }
}

function close() {
  emit('closed')
  qpay_modal.close()
}
</script>

<template>
  <Modal id="qpay_modal">
    <ModalBox class="max-w-[calc(50vw)]">
      <div class="grid grid-cols-2">
        <div>
          <Text semibold size="xl">Quick payment request</Text>
          <Label class="px-3">created by</Label>
          <QueryAndShow :id="document?.qp_created_by" :store="usersStore" />
        </div>
        <div class="mb-2 place-self-end">
          <QueryAndShow :id="document?.qp_organization" :store="organizationsStore" />
        </div>
      </div>

      <div class="flex space-x-3">
        <div class="md:w-1/3 md:mb-0">
          <Label class="mt-4 mb-1">Owner</Label>
          <TextInput disabled :modelValue="owner?.name" class="w-full" />
        </div>
        <div class="md:w-1/3 md:mb-0">
          <Label class="mt-4 mb-1">Vehicle</Label>
          <QueryAndShow asTextField :id="document?.qp_vehicle" :store="vehiclesStore" />
        </div>
      </div>

      <div class="flex space-x-3">
        <div class="md:w-1/3 md:mb-0">
          <Label class="mt-4 mb-1">Driver</Label>
          <QueryAndShow asTextField :id="document?.qp_driver" :store="driversStore" />
        </div>
        <div class="md:w-1/3 md:mb-0">
          <Label class="mt-4 mb-1">Amount</Label>
          <TextInput disabled v-model="amount" class="flex w-full" />
        </div>
      </div>

      <div>
        <Label class="mt-2">Note</Label>
        <TextInput class="w-full" v-model="note" />
      </div>

      <div class="flex space-x-3 mt-4 w-full">
        <div class="md:w-1/3 md:mb-0">
          <Label class="mt-2">Order number</Label>
          <TextInput disabled :modelValue="order?.number" class="w-full" />
        </div>
      </div>
      <div class="mb-4">
        <DriverAndVehicle :orderId="order?.id" :key="order?.id" />
      </div>
      <ModalAction>
        <Button
          v-for="next in nextStatuses"
          :key="next?.id"
          @click="changeStatus(next)"
          :style="'background-color: ' + (next?.color ?? '#333333')"
          class="btn-soft font-light tracking-wider text-white"
        >
          {{ next.name }}
        </Button>
        <Button class="btn-soft font-light tracking-wider ml-6" @click="close">Close</Button>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
