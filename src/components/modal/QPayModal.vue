<script setup lang="ts">
import type { OrderAndQuickPay, QuickPayUpdate } from '@/stores/quick_pays.ts'

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

const amount = ref<number>(0)
const percent = ref<number>(5)
const to_pay = ref<number>(0)
const note = ref<string>('')
const error = ref(false)

const isReadOnly = ref(false)

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
    isReadOnly.value = qpay.qp_stage === 12
    order.value = qpay as Order
    owner.value = await ownerStore.resolve(qpay.qp_owner)
    amount.value = qpay.qp_amount
    percent.value = qpay.qp_percent
    to_pay.value = qpay.qp_to_pay
    note.value = qpay.qp_note
    qpay_modal.showModal()

    console.log('resetAndShow', qpay)
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

async function changeStatusAndUpdate(next: Status | null | undefined) {
  const doc = props.document
  try {
    if (doc && next) {
      let data: QuickPayUpdate | null = {
        percent: percent.value,
        to_pay: to_pay.value,
        note: note.value,
      } as QuickPayUpdate
      if (isReadOnly.value) {
        data = null
      }
      await qpayStore.update(doc.qp_id, data, next)
      qpay_modal.close()
    }
  } catch (e) {
    console.log('error', e)
  }
}

function recalculate(event) {
  const pc = Number(event.data || percent.value)
  console.log('recalculate', pc, event)
  if (pc >= 0 && pc <= 5) {
    to_pay.value = amount.value * ((100.0 - pc) / 100.0)
    error.value = false
  } else {
    error.value = true
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
        <div class="md:w-1/3 md:mb-0">
          <Label class="mt-4 mb-1">Driver</Label>
          <QueryAndShow asTextField :id="document?.qp_driver" :store="driversStore" />
        </div>
      </div>

      <div class="flex space-x-3">
        <div class="md:w-1/3 md:mb-0">
          <Label class="mt-4 mb-1">Amount $</Label>
          <TextInput disabled v-model="amount" type="number" class="flex w-full" />
        </div>
        <div class="md:w-1/3 md:mb-0">
          <Label class="mt-4 mb-1">Percent to QP %</Label>
          <TextInput
            v-model="percent"
            type="number"
            class="flex w-full"
            @input="recalculate"
            :class="{ 'bg-amber-700': error }"
            :disabled="isReadOnly"
          />
        </div>
        <div class="md:w-1/3 md:mb-0">
          <Label class="mt-4 mb-1">To pay $</Label>
          <TextInput disabled v-model="to_pay" type="number" class="flex w-full" />
        </div>
      </div>

      <div>
        <Label class="mt-2">Note</Label>
        <TextInput class="w-full" v-model="note" :disabled="isReadOnly" />
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
        <template v-if="!error">
          <Button
            v-for="next in nextStatuses"
            :key="next?.id"
            @click="changeStatusAndUpdate(next)"
            :style="'background-color: ' + (next?.color ?? '#333333')"
            class="btn-soft font-light tracking-wider text-white"
          >
            {{ next.name }}
          </Button>
        </template>
        <Button class="btn-soft font-light tracking-wider ml-6" @click="close">Close</Button>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
