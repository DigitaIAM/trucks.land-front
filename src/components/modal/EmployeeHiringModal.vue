<script setup lang="ts">
import type { EmployeeHiring } from '@/stores/employee_hiring_history.ts'

const authStore = useAuthStore()
const usersStore = useUsersStore()

const listOfActions = [
  { color: '#43A047', id: 'hire', label: 'hire' },
  { color: '#E53935', id: 'fire', label: 'fire' },
]

const props = defineProps<{
  edit: EmployeeHiring | null
  disabled?: boolean
}>()

const id = ref<number>()
const organization = ref<number>()
const user_id = ref<number>()
const action = ref<string>('')
const date_action = ref(new Date() as Date | undefined)
const details = ref('')
const performed_by = ref<User>()

const emit = defineEmits(['closed'])

watch(
  () => props.edit,
  (record) => {
    resetAndShow(record)
  },
  { deep: true },
)

async function resetAndShow(record: EmployeeHiring) {
  if (record.id === null) {
    modal_hiring.close()
    return
  }
  const account = authStore.currentAccount()
  id.value = record?.id
  organization.value = record?.organization
  user_id.value = record ? { id: record.user_id } : null
  action.value = record?.action
  date_action.value = date_action.value
  details.value = details.value
  performed_by.value = record ? { id: record.performed_by } : account ? { id: account.id } : null

  modal_hiring.showModal()
}

function setActionType(v: string) {
  if (!props.disabled) {
    action.value = v
  }
}
</script>

<template>
  <Text size="2xl" class="px-4">Rewards</Text>
  <div class="flex flex-row gap-6 px-4 mb-2 mt-3">
    <SearchVue :store="usersStore"></SearchVue>
    <Button class="btn-soft font-light tracking-wider" @click="resetAndShow({} as EmployeeHiring)"
      >Create</Button
    >
  </div>
  <Modal id="modal_hiring">
    <ModalBox class="w-2/5">
      <div class="flex items-start justify-between">
        <div>
          <Text class="w-full mt-1" size="xl">Payment # {{ id }}</Text>
        </div>
        <div class="flex items-center justify-between">
          <Button
            sm
            class="mr-1 mb-2"
            v-for="type in listOfActions"
            :key="type.id"
            :style="{
              backgroundColor: action === type.id ? type.color : 'transparent',
              color: action === type.id ? 'white' : '#475569',
            }"
            @click="setActionType(type.id)"
          >
            {{ type.label }}
          </Button>
        </div>
      </div>
      <div>
        <Label class="mt-2">Employee</Label>
        <selector v-model="user_id" :store="usersStore" />
      </div>
      <Label class="mb-2 mt-4">Note</Label>
      <TextInput class="w-full" v-model="details" />
      <ModalAction>
        <form method="dialog">
          <Button class="btn-soft font-light tracking-wider">
            <span v-if="id > 0">Update</span><span v-else>Create</span>
          </Button>
          <Button class="btn-soft font-light tracking-wider ml-6">Close</Button>
        </form>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
