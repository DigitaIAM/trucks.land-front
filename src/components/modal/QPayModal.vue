<script setup lang="ts">
const ownerStore = useOwnersStore()
const usersStore = useUsersStore()
const organizationsStore = useOrganizationsStore()
const ordersStore = useOrdersStore()
const driversStore = useDriversStore()
const vehiclesStore = useVehiclesStore()

const props = defineProps<{
  document: QuickPays | null
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

async function resetAndShow(qpay: QuickPays) {
  console.log('qpay', qpay)
  if (qpay) {
    order.value = await ordersStore.resolve(qpay.order)
    owner.value = await ownerStore.resolve(qpay.owner)
    amount.value = qpay.amount
    note.value = qpay.note
    qpay_modal.showModal()
  } else {
    qpay_modal.close()
  }
}
</script>

<template>
  <Modal id="qpay_modal">
    <ModalBox class="max-w-[calc(50vw)]">
      <div class="grid grid-cols-2">
        <div>
          <Text semibold size="xl">Quick payment request</Text>
          <Label class="px-3">created by</Label>
          <QueryAndShow :id="document?.created_by" :store="usersStore" />
        </div>
        <div class="mb-2 place-self-end">
          <QueryAndShow :id="document?.organization" :store="organizationsStore" />
        </div>
      </div>

      <div class="flex space-x-3">
        <div class="md:w-1/3 md:mb-0">
          <Label class="mt-4 mb-1">Owner</Label>
          <TextInput disabled :modelValue="owner?.name" class="w-full" />
        </div>
        <div class="md:w-1/3 md:mb-0">
          <Label class="mt-4 mb-1">Vehicle</Label>
          <QueryAndShow asTextField :id="document?.vehicle" :store="vehiclesStore" />
        </div>
      </div>

      <div class="flex space-x-3">
        <div class="md:w-1/3 md:mb-0">
          <Label class="mt-4 mb-1">Driver</Label>
          <QueryAndShow asTextField :id="document?.driver" :store="driversStore" />
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
        <DriverAndVehicle :orderId="order?.id" />
      </div>
      <ModalAction>
        <form method="dialog">
          <Button class="btn-soft font-light tracking-wider"> Compiled</Button>
          <Button class="btn-soft font-light tracking-wider ml-6">Close</Button>
        </form>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
