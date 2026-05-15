<script setup lang="ts">
import type { SettlementEmployeeCreate } from '@/stores/employee_settlements.ts'
import { useEmployeeSettlementsTypeStore } from '@/stores/employee_settlements_type.ts'

const authStore = useAuthStore()
const usersStore = useUsersStore()
const settlementsEmployeeStore = useSettlementsEmployeeStore()
const settlementTypesStore = useEmployeeSettlementsTypeStore()

interface Props {
  edit: SettlementEmployee | null
  disabled?: boolean | null
  types: string[] | null
  allowEmployeeSelection?: boolean
  paymentId?: number | null
}

const props = withDefaults(defineProps<Props>(), {
  edit: null,
  disabled: false,
  types: null,
  allowEmployeeSelection: false,
})

const id = ref<number>()
const organization = ref<number>()
const employee = ref<User | null>()
const settlement_type = ref<number>()
const currency = ref<string>('USD')
const amount = ref<number>()
const notes = ref('')
const created_by = ref<User | null>(null)

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
  if (!settlement) {
    return
  }

  const account = authStore.currentAccount()

  id.value = settlement?.id
  organization.value = settlement?.organization
  employee.value = settlement ? ({ id: settlement.employee } as User) : null
  settlement_type.value = settlement?.settlement_type ?? 'bonus'
  currency.value = settlement?.currency
  amount.value = settlement?.amount
  notes.value = settlement?.notes || ''
  created_by.value = settlement
    ? ({ id: settlement.created_by } as User)
    : account
      ? ({ id: account.id } as User)
      : null

  try {
    const { data } = await supabase
      .from('employee_unpaid_settlements')
      .select('id')
      .eq('organization', authStore.oid)

    const unpaidSettlements = data || []
    if (settlement?.id) {
      isDocumentUnpaid.value = unpaidSettlements.some((item) => item.id === settlement.id)
    } else {
      isDocumentUnpaid.value = true // Если мы создаем новую запись (нет id), форма активна
    }
  } catch (err) {
    console.error('Ошибка при проверке статуса документа:', err)
  }

  settlement_modal.showModal()
}

async function updateSettlement() {
  console.log('Current settlement_type value:', settlement_type.value)
  if (isFormDisabled.value) return

  if (!employee.value || !amount.value || !settlement_type.value) {
    alert('Please select an employee, type, and enter an amount')
    return
  }

  const typeId = settlement_type.value.id
  const typeText = settlement_type.value.settlement_type

  const paymentData = {
    organization: authStore.oid,
    employee: employee.value.id,
    settlement_type: typeId,
    amount: amount.value,
    currency: currency.value,
    notes: notes.value,
  }

  console.log('Payload sent to store:', paymentData)

  const currentId = id.value
  let savedSettlement: any = null

  try {
    if (currentId && currentId > 0) {
      savedSettlement = await settlementsEmployeeStore.update(
        currentId,
        paymentData as SettlementEmployeeUpdate,
      )
    } else {
      savedSettlement = await settlementsEmployeeStore.create(
        paymentData as SettlementEmployeeCreate,
      )
    }

    console.log('What we got from store:', savedSettlement)

    if (props.paymentId && props.paymentId > 0) {
      const finalSettlementId = savedSettlement?.id || currentId

      const relationData = {
        doc_payment: props.paymentId,
        doc_settlements: finalSettlementId,
        amount: amount.value,
        settlement_type: typeText, // Передаем текст ('fine', 'advance' и т.д.)
        doc_payment_closed: false,
      }

      console.log('Sending relation to employee_payment_settlements:', relationData)

      const { error: relError } = await supabase
        .from('employee_payment_settlements')
        .insert(relationData)

      if (relError) {
        console.error('Error creating link to payment:', relError)
        alert('Settlement created, but failed to link with payment: ' + relError.message)
      }
    }

    // Закрываем модалку только при успешном выполнении
    settlement_modal.close()
    emit('closed')
  } catch (error: any) {
    console.error('Failed to update/create settlement:', error)

    if (error.code === '23502') {
      alert('Ошибка сохранения: Обязательное поле "Тип начисления" не заполнено.')
    } else {
      alert('Произошла ошибка при сохранении: ' + (error.message || 'Неизвестная ошибка'))
    }
  }
}

onMounted(() => {
  settlementTypesStore.fetchListing()
})

const getButtonStyle = (type: any) => {
  const isActive = settlement_type.value?.id === type.id
  const baseColor = type.color
  return {
    backgroundColor: isActive ? baseColor : 'transparent',
    color: isActive ? 'white' : baseColor,
  }
}

function setAbsenceType(type) {
  if (!isFormDisabled.value) {
    settlement_type.value = type
    currency.value = type.currency
  }
}
</script>

<template>
  <Modal id="settlement_modal" ref="settlement_modal_ref">
    <ModalBox class="w-2/5">
      <div class="mt-1 mb-4">
        <Text class="w-full" size="xl">Payment # {{ id }}</Text>
      </div>
      <div class="flex">
        <Button
          sm
          class="mr-2 mb-2"
          v-for="type in settlementTypesStore.listing"
          :key="type.id"
          :style="getButtonStyle(type)"
          @click="setAbsenceType(type)"
        >
          {{ type.settlement_type }}
        </Button>
      </div>

      <div>
        <Label class="mt-2">Employee</Label>
        <selector
          v-if="allowEmployeeSelection"
          class="w-full"
          v-model="employee"
          :store="usersStore"
          name="real_name"
        />
        <QueryAndShow v-else asTextField :id="employee?.id" :store="usersStore" name="real_name" />
      </div>
      <Label class="mb-2 mt-4">Note</Label>
      <TextInput class="w-full" :disabled="isFormDisabled" v-model="notes" />
      <div class="flex space-x-3 mb-4 w-full">
        <div class="md:w-1/2 md:mb-0">
          <Label class="mt-4 mb-2">Amount in {{ currency }}</Label>
          <TextInput :disabled="isFormDisabled" v-model="amount" />
        </div>
      </div>
      <div
        v-if="!isDocumentUnpaid && id"
        class="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded mb-6 text-sm"
      >
        ⚠️ This document has already been paid for. Editing is not available.
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
