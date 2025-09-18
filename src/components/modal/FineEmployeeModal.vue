<script setup lang="ts">
const authStore = useAuthStore()
const usersStore = useUsersStore()
const finesEmployeeStore = useFinesEmployeeStore()

const props = defineProps<{
  edit: FinesEmployee | null
}>()

const id = ref<number>()
const organization = ref<number>()
const employee = ref<number>()
const description = ref('')
const amount = ref<number>()
const createdBy = ref<Reference>({ id: authStore.account?.id ?? -1 })

const emit = defineEmits(['closed'])

watch(
  () => props.edit,
  (fine) => {
    resetAndShow(fine)
  },
  { deep: true },
)

function resetAndShow(fine: FinesEmployee | null) {
  id.value = fine?.id
  organization.value = fine?.organization
  employee.value = fine ? { id: fine.employee } : null
  description.value = fine?.description || ''
  amount.value = fine?.amount
  createdBy.value = {
    id: fine?.created_by ?? authStore.account?.id,
  }

  fine_modal.showModal()
}

function savePayment() {
  if (id.value == null) {
    finesEmployeeStore.create({
      organization: authStore.oid,
      employee: employee.value?.id,
      description: description.value,
      amount: amount.value,
      created_by: authStore.account?.id,
    } as FinesEmployeeCreate)
  } else {
    finesEmployeeStore.update(id.value, {
      employee: employee.value?.id,
      description: description.value,
      amount: amount.value,
      created_by: authStore.account?.id,
    } as FinesEmployeeUpdate)
  }
  fine_modal.close()
  emit('closed')

  console.log('savePayment', employee.value?.id)
}
</script>

<template>
  <div class="flex flex-row gap-6 px-4 mb-2 mt-3">
    <Text size="2xl">Fines</Text>
    <SearchVue :store="usersStore"></SearchVue>
    <Button class="btn-soft font-light tracking-wider" @click="resetAndShow(null)">Create</Button>
  </div>
  <Modal id="fine_modal">
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
      <TextInput class="w-full" v-model="description" />

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
