<script setup lang="ts">
const authStore = useAuthStore()
const usersStore = useUsersStore()
const paymentsAdditionalToEmployeeStore = usePaymentsAdditionalToEmployeeStore()

const props = defineProps<{
  edit: PaymentsAdditionalToEmployee | null
}>()

const id = ref<number>()
const organization = ref<number>()
const employee = ref<number>()
const kind = ref('')
const amount = ref<number>()
const createdBy = ref<Reference>({ id: authStore.account?.id ?? -1 })

const emit = defineEmits(['closed'])

watch(
  () => props.edit,
  (payment) => {
    resetAndShow(payment)
  },
  { deep: true },
)

function resetAndShow(payment: PaymentsAdditionalToEmployee | null) {
  id.value = payment?.id
  organization.value = payment?.organization
  employee.value = payment ? { id: payment.employee } : null
  kind.value = payment?.kind || ''
  amount.value = payment?.amount
  createdBy.value = {
    id: payment?.created_by ?? authStore.account?.id,
  }

  payment_modal.showModal()
}

function savePayment() {
  if (id.value == null) {
    paymentsAdditionalToEmployeeStore.create({
      organization: authStore.oid,
      employee: employee.value?.id,
      kind: kind.value,
      amount: amount.value,
      created_by: authStore.account?.id,
    } as PaymentsAdditionalToEmployeeCreate)
  } else {
    paymentsAdditionalToEmployeeStore.update(id.value, {
      employee: employee.value?.id,
      kind: kind.value,
      amount: amount.value,
      created_by: authStore.account?.id,
    } as PaymentsAdditionalToEmployeeUpdate)
  }
  payment_modal.close()
  emit('closed')
  console.log('savePayment', employee.value?.id)
}
</script>

<template>
  <div class="flex flex-row gap-6 px-4 mb-2 mt-3">
    <Text size="2xl">Additional payments</Text>
    <SearchVue :store="usersStore"></SearchVue>
    <Button class="btn-soft font-light tracking-wider" @click="resetAndShow(null)">Create</Button>
  </div>
  <Modal id="payment_modal">
    <ModalBox class="w-2/5">
      <div class="flex space-x-2 w-full">
        <Text class="w-full mt-1" size="xl">Payment # {{ id }}</Text>
        <Label class="mb-1">created by</Label>
        <selector class="w-full" :modelValue="createdBy" :store="usersStore" disabled />
      </div>
      <div>
        <Label class="mt-2 mb-2">Employee</Label>
        <selector v-model="employee" :store="usersStore" />
      </div>
      <Label class="mb-2 mt-4">Description</Label>
      <TextInput class="w-full" v-model="kind" />

      <div class="md:w-1/2 md:mb-0">
        <Label class="mt-4 mb-2">Amount $</Label>
        <TextInput v-model="amount" />
      </div>
      <ModalAction>
        <form method="dialog">
          <Button class="btn-soft font-light tracking-wider" @click="savePayment()">
            <span v-if="id > 0">Update</span><span v-else>Create</span>
          </Button>
          <Button class="btn-soft font-light tracking-wider ml-6">Close</Button>
        </form>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
