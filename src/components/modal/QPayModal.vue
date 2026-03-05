<script setup lang="ts">
import { useOrganizationsStore } from '@/stores/organizations.ts'

const ownerStore = useOwnersStore()
const authStore = useAuthStore()
const usersStore = useUsersStore()
const organizationsStore = useOrganizationsStore()

const props = defineProps<{
  document: QuickPays | null
}>()

const created_by = ref<User | Reference>()
const organization = ref<number>()
const order = ref<number>()
const owner = ref<Owner | Reference>()
const driver = ref<Driver | Reference>()
const vehicle = ref<Vehicle | Reference>()
const amount = ref<number>()
const note = ref<string>()

const emit = defineEmits(['closed'])

watch(
  () => props.document,
  (id) => {
    resetAndShow(id)
  },
  { deep: true },
)

function resetAndShow(qpay: QuickPays) {
  const account = authStore.currentAccount()
  created_by.value = qpay ? { id: qpay.created_by } : account ? { id: account.id } : null
  organization.value = qpay.organization
  order.value = qpay.order
  owner.value = qpay ? { id: qpay.owner } : null
  driver.value = qpay ? { id: qpay.driver } : null
  vehicle.value = qpay ? { id: qpay.vehicle } : null
  amount.value = qpay.amount
  note.value = qpay.note

  qpay_modal.showModal()
}
</script>

<template>
  <Modal id="qpay_modal">
    <ModalBox class="max-w-[calc(50vw)]">
      <div class="grid grid-cols-2">
        <div>
          <Text semibold size="xl">Quick payment request</Text>
          <Label class="px-3">created by</Label>
          <QueryAndShow :id="created_by" :store="usersStore" />
        </div>
        <div class="mb-2 place-self-end">
          <QueryAndShow :id="organization" :store="organizationsStore" />
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
      <div class="mb-4">
        <DriverAndVehicle :orderId="order" />
      </div>
      <div class="flex space-x-3 mt-4 w-full">
        <div class="md:w-1/3 md:mb-0">
          <Label class="mt-2">Order number</Label>
          <TextInput disabled :modelValue="props.document" class="w-full" />
        </div>
        <div class="md:w-2/3 md:mb-0">
          <Label class="mt-2 mb-1">Vehicle owner</Label>
          <div>
            <QueryAndShow :id="owner" :store="ownerStore" class="w-full" />
          </div>
        </div>
      </div>
      <ModalAction>
        <form method="dialog">
          <Button class="btn-soft font-light tracking-wider">
            <span v-if="id > 0">Update</span><span v-else>Send request</span>
          </Button>
          <Button class="btn-soft font-light tracking-wider ml-6">Close</Button>
        </form>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
