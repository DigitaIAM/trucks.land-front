import { acceptHMRUpdate, defineStore } from 'pinia'
import type { PaymentToOwnerOrderCreate } from '@/stores/payment_to_owners_orders.ts'

export interface PaymentToOwnerSummary {
  id: number
  created_at: string
  created_by: number
  organization: number
  owner: number
  year: number
  week: number
  orders: number
  payment: number
  expenses: number
  payout: number
}

export interface PaymentToOwner extends PaymentToOwnerCreate {
  id: number
  created_at: string
}

export interface PaymentToOwnerCreate {
  created_by: number
  organization: number
  owner: number
  year: number
  week: number
}

export const usePaymentToOwnerStore = defineStore('payments_to_owners', () => {
  const mapping = ref(new Map<number, PaymentToOwnerSummary | Promise<PaymentToOwnerSummary>>())

  const { initialized, loading } = useInitializeStore(async () => {
    const response = await supabase.from('payments_to_owners_journal').select()

    // console.log('response', response)

    const map = new Map<number, PaymentToOwnerSummary>()
    response.data?.forEach((json) => {
      const payment = json as PaymentToOwnerSummary
      map.set(payment.id, payment)
    })

    mapping.value = map
  })

  const listing = computedAsync(async () => {
    const list = [] as PaymentToOwnerSummary[]

    for (const obj of mapping.value.values()) {
      list.push(await obj)
    }
    // console.log('list', list)
    return list
  })

  async function create(
    payment: PaymentToOwnerCreate,
    paymentRecords: Array<PaymentToOwnerOrderCreate>,
    expenseRecords: Array<PaymentToOwnerExpenseCreate>,
  ) {
    const response = await supabase
      .from('payments_to_owners')
      .insert(payment)
      .select()
      .throwOnError()

    // console.log('response', response)

    if (response.status == 201 && response.data?.length == 1) {
      const payment = response.data[0] as PaymentToOwner
      mapping.value.set(payment.id, payment)

      console.log('payment', payment)

      for (const record of paymentRecords) {
        record.document = payment.id
      }

      for (const record of expenseRecords) {
        record.document = payment.id
      }

      await supabase
        .from('payments_to_owners_orders')
        .insert(paymentRecords)
        .select()
        .throwOnError()

      await supabase
        .from('payments_to_owners_expenses')
        .insert(expenseRecords)
        .select()
        .throwOnError()
    } else {
      throw 'unexpended response status: ' + response.status
    }
  }

  return { initialized, loading, listing, create }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePaymentToOwnerStore, import.meta.hot))
}
