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
const employee = ref<number | undefined>()
const settlement_type = ref<string>('bonus')
const amount = ref<number>()
const notes = ref('')
const created_by = ref<User>()

const unpaidSettlements = ref<any[]>([])

const isDocumentUnpaid = ref(true)

const isFormDisabled = computed(() => {
  return props.disabled || !isDocumentUnpaid.value
})

const emit = defineEmits(['closed'])

watch(
  () => props.edit,
  (settlement) => {
    resetAndShow(settlement)
  },
  { deep: true },
)

async function resetAndShow(settlement: SettlementEmployee | null) {
  const account = authStore.currentAccount()

  id.value = settlement?.id
  organization.value = settlement?.organization
  employee.value = settlement ? settlement.employee : undefined
  settlement_type.value = settlement?.settlement_type ?? 'bonus'
  amount.value = settlement?.amount
  notes.value = settlement?.notes || ''
  created_by.value = settlement
    ? { id: settlement.created_by }
    : account
      ? { id: account.id }
      : null

  try {
    const { data } = await supabase
      .from('employee_unpaid_settlements')
      .select('id')
      .eq('organization', authStore.oid)

    unpaidSettlements.value = data || []
    if (settlement?.id) {
      isDocumentUnpaid.value = unpaidSettlements.value.some((item) => item.id === settlement.id)
    } else {
      isDocumentUnpaid.value = true // Если мы создаем новую запись (нет id), форма активна
    }
  } catch (err) {
    console.error('Ошибка при проверке статуса документа:', err)
  }

  settlement_modal.showModal()
}

function updateSettlement() {
  if (isFormDisabled.value) return

  const currentId = id.value
  if (currentId === undefined) {
    return
  }

  if (!employee.value || !amount.value) {
    alert('Please select an employee and enter an amount')
    return
  }

  const paymentData = {
    organization: authStore.oid,
    employee: employee.value,
    settlement_type: settlement_type.value, // 'bonus', 'premium' или 'vacation pay'
    amount: amount.value,
    notes: notes.value,
  }

  settlementsEmployeeStore.update(currentId, paymentData as SettlementEmployeeUpdate)

  settlement_modal.close()
  emit('closed')

  console.log('savePayment', employee.value)
}

function setAbsenceType(v: string) {
  if (!isFormDisabled.value) {
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

      <div
        v-if="!isDocumentUnpaid && id"
        class="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded mb-4 text-sm"
      >
        ⚠️ Этот документ уже оплачен. Редактирование недоступно.
      </div>

      <div>
        <Label class="mt-2">Employee</Label>
        <QueryAndShow asTextField :id="employee" :store="usersStore" name="real_name" />
      </div>
      <Label class="mb-2 mt-4">Note</Label>
      <TextInput class="w-full" :disabled="isFormDisabled" v-model="notes" />
      <div class="flex space-x-3 mb-2 w-full">
        <div class="md:w-1/2 md:mb-0">
          <Label class="mt-4 mb-2"
            >Amount
            <span class="text-xs font-normal opacity-70">
              ({{ settlement_type === 'vacation pay' ? 'UZS' : 'USD' }})
            </span>
          </Label>
          <TextInput :disabled="isFormDisabled" v-model="amount" />
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
          <Button class="btn-soft font-light tracking-wider" @click="updateSettlement()">
            <span v-if="id > 0">Update</span><span v-else>Create</span>
          </Button>
          <Button class="btn-soft font-light tracking-wider ml-6">Close</Button>
        </form>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
