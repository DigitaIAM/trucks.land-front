<script setup lang="ts">
const authStore = useAuthStore()
const usersStore = useUsersStore()
const settlementsEmployeeStore = useSettlementsEmployeeStore()

const listOfSettelments = [
  { color: '#94a3b8', id: 'bonus', label: 'bonus' },
  { color: '#f59e0b', id: 'premium', label: 'premium' },
  { color: '#3b82f6', id: 'vacation pay', label: 'vacation pay' },
]

const props = defineProps<{
  edit: SettlementEmployee | null
  disabled?: boolean
}>()

const id = ref<number>()
const organization = ref<number>()
const employee = ref<number>()
const settlement_type = ref<string>('bonus')
const amount = ref<number>()
const notes = ref('')
const created_by = ref<User>()

const emit = defineEmits(['closed'])

watch(
  () => props.edit,
  (settlement) => {
    resetAndShow(settlement)
  },
  { deep: true },
)

function resetAndShow(settlement: SettlementEmployee | null) {
  const account = authStore.currentAccount()

  id.value = settlement?.id
  organization.value = settlement?.organization
  employee.value = settlement ? { id: settlement.employee } : null
  settlement_type.value = settlement?.settlement_type ?? 'bonus'
  amount.value = settlement?.amount
  notes.value = settlement?.notes || ''
  created_by.value = settlement
    ? { id: settlement.created_by }
    : account
      ? { id: account.id }
      : null

  settlement_modal.showModal()
}

function updatSettlement() {
  if (!employee.value?.id || !amount.value) {
    alert('Please select an employee and enter an amount')
    return
  }

  const paymentData = {
    organization: authStore.oid,
    employee: employee.value.id,
    settlement_type: settlement_type.value, // 'bonus', 'premium' или 'vacation pay'
    amount: amount.value,
    notes: notes.value,
  }

  settlementsEmployeeStore.update(id.value, paymentData as SettlementEmployeeUpdate)

  settlement_modal.close()
  emit('closed')

  console.log('savePayment', employee.value?.id)
}

function setAbsenceType(v: string) {
  if (!props.disabled) {
    settlement_type.value = v
  }
}
</script>

<template>
  <Text size="2xl" class="px-4">Rewards</Text>
  <div class="flex flex-row gap-6 px-4 mb-2 mt-3">
    <SearchVue :store="usersStore"></SearchVue>
    <!--    <Button class="btn-soft font-light tracking-wider" @click="resetAndShow(null)">Create</Button>-->
  </div>
  <Modal id="settlement_modal" ref="settlement_modal_ref">
    <ModalBox class="w-2/5">
      <div class="flex items-start justify-between">
        <div>
          <Text class="w-full mt-1" size="xl">Payment # {{ id }}</Text>
        </div>
        <div class="flex items-center justify-between">
          <Button
            sm
            class="mr-1 mb-2"
            v-for="type in listOfSettelments"
            :key="type.id"
            :style="{
              backgroundColor: settlement_type === type.id ? type.color : 'transparent',
              color: settlement_type === type.id ? 'white' : '#475569',
            }"
            @click="setAbsenceType(type.id)"
          >
            {{ type.label }}
          </Button>
        </div>
      </div>
      <div>
        <Label class="mt-2">Employee</Label>
        <selector disabled v-model="employee" :store="usersStore" />
      </div>
      <Label class="mb-2 mt-4">Note</Label>
      <TextInput class="w-full" v-model="notes" />
      <div class="flex space-x-3 mb-2 w-full">
        <div class="md:w-1/2 md:mb-0">
          <Label class="mt-4 mb-2"
            >Amount
            <span class="text-xs font-normal opacity-70">
              ({{ settlement_type === 'vacation pay' ? 'UZS' : 'USD' }})
            </span>
          </Label>
          <TextInput v-model="amount" />
          <p
            v-if="settlement_type === 'vacation pay'"
            class="text-amber-600 text-sm mt-1 font-medium"
          >
            ⚠️ Please indicate the amount in Uzbek sums (UZS)
          </p>
        </div>
      </div>
      <ModalAction>
        <form method="dialog">
          <Button class="btn-soft font-light tracking-wider" @click="updatSettlement()">
            <span v-if="id > 0">Update</span><span v-else>Create</span>
          </Button>
          <Button class="btn-soft font-light tracking-wider ml-6">Close</Button>
        </form>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
