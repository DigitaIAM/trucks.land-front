<script setup lang="ts">
const props = defineProps<{
  edit: ExpensesToOwner | null
}>()

const id = ref<number>()
const owner = ref<number>()
const kind = ref('')
const amount = ref<number>()
const created_by = ref<number>()

const emit = defineEmits(['closed'])

watch(
  () => props.edit,
  (expense) => {
    resetAndShow(expense)
  },
  { deep: true },
)

const expensesOwnerStore = useExpensesToOwnerStore()
const ownerStore = useOwnersStore()
const authStore = useAuthStore()
const usersStore = useUsersStore()

function resetAndShow(expense: ExpensesToOwner | null) {
  id.value = expense?.id
  owner.value = expense?.owner
  kind.value = expense?.kind || ''
  amount.value = expense?.amount
  created_by.value = expense?.created_by

  expense_modal.showModal()
}

function saveExpenses() {
  if (id.value == null) {
    expensesOwnerStore.create({
      owner: owner.value?.id,
      kind: kind.value,
      amount: amount.value,
      created_by: authStore.account?.id,
    } as ExpensesToOwnerCreate)
  } else {
    expensesOwnerStore.update(id.value, {
      owner: owner.value?.id,
      kind: kind.value,
      amount: amount.value,
      created_by: authStore.account?.id,
    } as ExpensesToOwnerUpdate)
  }
  expense_modal.close()
  emit('closed')
}
</script>

<template>
  <div class="flex flex-row gap-6 px-4 mb-2 mt-3">
    <Text size="2xl">Expenses to owners</Text>
    <Search :store="ownerStore"></Search>
    <Button class="btn-soft font-light tracking-wider" @click="resetAndShow(null)">Create</Button>
  </div>
  <Modal id="expense_modal">
    <ModalBox class="w-2/5">
      <div class="flex space-x-3 w-full">
        <Text size="2xl">Expenses</Text>
        <Label class="mb-1">created by</Label>
        <selector class="w-full" :modelValue="authStore.account" :store="usersStore" disabled />
      </div>
      <div>
        <Label class="mt-2 mb-2">Owner</Label>
        <selector v-model="owner" :store="ownerStore" />
      </div>
      <Label class="mb-2 mt-4">Description</Label>
      <TextInput class="w-full" v-model="kind" />

      <div class="md:w-1/2 md:mb-0">
        <Label class="mt-4 mb-2">Amount $</Label>
        <TextInput v-model="amount" />
      </div>
      <ModalAction>
        <form method="dialog">
          <Button class="btn-soft font-light tracking-wider" @click="saveExpenses">
            {{ id > 0 ? 'Update' : 'Create' }}
          </Button>
          <Button class="btn-soft font-light tracking-wider ml-6">Close</Button>
        </form>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
