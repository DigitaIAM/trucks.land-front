import { acceptHMRUpdate, defineStore } from 'pinia'
import type { PaymentToOwnerOrderCreate } from '@/stores/payment_to_owners_orders.ts'

export interface PaymentToOwnerSummary {
  id: number
  created_at: string
  created_by: number
  owner: number
  year: number
  week: number
  amount: number
  payment: number
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

  async function create(payment: PaymentToOwnerCreate, records: Array<PaymentToOwnerOrderCreate>) {
    const response = await supabase
      .from('payments_to_owners')
      .insert(payment)
      .select()
      .throwOnError()

    console.log('response', response)

    if (response.status == 201 && response.data?.length == 1) {
      const payment = response.data[0] as PaymentToOwner
      mapping.value.set(payment.id, payment)

      console.log('payment', payment)

      for (const record of records) {
        record.document = payment.id
      }

      console.log('records', records)

      const responseRecords = await supabase
        .from('payments_to_owners_orders')
        .insert(records)
        .select()
        .throwOnError()

      console.log('responseRecords', responseRecords)
    } else {
      throw 'unexpended response status: ' + response.status
    }
  }

  return { initialized, loading, listing, create }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePaymentToOwnerStore, import.meta.hot))
}
