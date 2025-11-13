<script setup lang="ts">
const authStore = useAuthStore()
const usersStore = useUsersStore()
const settlementsEmployeeStore = useSettlementsEmployeeStore()

const props = defineProps<{
  edit: SettlementEmployee | null
}>()

const id = ref<number>()
const organization = ref<number>()
const employee = ref<number>()
const notes = ref('')
const amount = ref<number>()
const created_by = ref<User>()


const emit = defineEmits(['closed'])

watch(
  () => props.edit,
  (settlement) => {
    resetAndShow(settlement)
  },
  { deep: true }
)

function resetAndShow(settlement: SettlementEmployee | null) {
  const account = authStore.currentAccount()

  id.value = settlement?.id
  organization.value = settlement?.organization
  employee.value = settlement ? { id: settlement.employee } : null
  notes.value = settlement?.notes || ''
  amount.value = settlement?.amount
  created_by.value = settlement ? { id: settlement.created_by } : account ? { id: account.id } : null

  settlement_modal.showModal()
}

function savePayment() {
  if (id.value == null) {
    settlementsEmployeeStore.create({
      organization: authStore.oid,
      employee: employee.value?.id,
      notes: notes.value,
      amount: amount.value
    } as SettlementEmployeeCreate)
  } else {
    settlementsEmployeeStore.update(id.value, {
      employee: employee.value?.id,
      notes: notes.value,
      amount: amount.value
    } as SettlementEmployeeUpdate)
  }
  settlement_modal.close()
  emit('closed')

  console.log('savePayment', employee.value?.id)
}
</script>

<template>
  <div class="flex flex-row gap-6 px-4 mb-2 mt-3">
    <Text size="2xl">Settlements</Text>
    <SearchVue :store="usersStore"></SearchVue>
    <Button class="btn-soft font-light tracking-wider" @click="resetAndShow(null)">Create</Button>
  </div>
  <Modal id="settlement_modal">
    <ModalBox class="w-2/5">
      <div class="flex space-x-2 w-full">
        <Text class="w-full mt-1" size="xl">Payment # {{ id }}</Text>
        <Label class="mb-1">created by</Label>
        <selector class="w-full" :modelValue="created_by" :store="usersStore" disabled />
      </div>
      <div>
        <Label class="mt-2 mb-2">Employee</Label>
        <selector v-model="employee" :store="usersStore" />
      </div>
      <Label class="mb-2 mt-4">Description</Label>
      <TextInput class="w-full" v-model="notes" />

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
