<script setup lang="ts">
import dayjs from 'dayjs'

const expensesOwnerStore = useExpensesToOwnerStore()
const paymentToOwnerExpenseStore = usePaymentToOwnerExpenseStore()
const ownerStore = useOwnersStore()
const authStore = useAuthStore()
const usersStore = useUsersStore()

const props = defineProps<{
  edit?: ExpensesToOwner | null
  documentId?: number
  documentOwner?: number
  documentWeek?: number
  documentYear?: number
  show?: number
  embedded?: boolean
}>()

const id = ref<number>()
const organization = ref<number>()
const owner = ref<number>()
const notes = ref('')
const amount = ref<number>()
const created_by = ref<User>()

const emit = defineEmits(['closed'])

watch(
  () => props.edit,
  (expense) => {
    if (expense) resetAndShow(expense)
  },
  { deep: true },
)

watch(
  () => props.show,
  () => {
    if (props.show) {
      resetAndShow(null)
    }
  },
)

function resetAndShow(expense: ExpensesToOwner | null) {
  const account = authStore.currentAccount()

  id.value = expense?.id
  organization.value = expense?.organization
  owner.value = expense
    ? { id: expense.owner }
    : props.documentOwner
      ? { id: props.documentOwner }
      : null
  notes.value = expense?.notes || ''
  amount.value = expense?.amount
  created_by.value = expense ? { id: expense.created_by } : account ? { id: account.id } : null

  expense_modal.showModal()
}

async function saveExpenses() {
  if (id.value == null) {
    const week = props.documentWeek ?? dayjs().isoWeek()
    const year = props.documentYear ?? dayjs().year()

    const created = await expensesOwnerStore.create({
      organization: authStore.oid,
      owner: owner.value?.id,
      notes: notes.value,
      amount: amount.value,
      week,
      year,
    } as ExpensesToOwnerCreate)

    if (created && props.documentId) {
      const account = authStore.currentAccount()
      await paymentToOwnerExpenseStore.create({
        created_by: account?.id || 0,
        doc_payment: props.documentId,
        doc_expense: created.id,
        amount: created.amount,
      } as PaymentToOwnerExpenseCreate)
    }
  } else {
    expensesOwnerStore.update(id.value, {
      owner: owner.value?.id,
      notes: notes.value,
      amount: amount.value,
    } as ExpensesToOwnerUpdate)

    await supabase
      .from('owner_payment_expenses')
      .update({ amount: amount.value })
      .eq('doc_expense', id.value)
  }
  expense_modal.close()
  emit('closed')
}
</script>

<template>
  <div v-if="!embedded" class="flex flex-row gap-6 px-4 mb-2 mt-3">
    <Text size="2xl">Expenses</Text>
    <SearchVue :store="ownerStore"></SearchVue>
  </div>
  <Modal id="expense_modal">
    <ModalBox class="w-2/5">
      <div class="flex space-x-2 w-full">
        <Text class="w-full mt-1" size="xl">Expenses # {{ id }}</Text>
        <Label class="mb-1">created by</Label>
        <selector class="w-full" :modelValue="created_by" :store="usersStore" disabled />
      </div>
      <div>
        <Label class="mt-2 mb-2">Owner</Label>
        <selector v-model="owner" :store="ownerStore" />
      </div>
      <Label class="mb-2 mt-4">Description</Label>
      <TextInput class="w-full" v-model="notes" />

      <div class="md:w-1/2 md:mb-0">
        <Label class="mt-4 mb-2">Amount $</Label>
        <TextInput v-model="amount" />
      </div>
      <ModalAction>
        <form method="dialog">
          <Button class="btn-soft font-light tracking-wider" @click="saveExpenses()">
            <span v-if="id > 0">Update</span><span v-else>Create</span>
          </Button>
          <Button class="btn-soft font-light tracking-wider ml-6">Close</Button>
        </form>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
