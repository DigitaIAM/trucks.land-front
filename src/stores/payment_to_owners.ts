import { acceptHMRUpdate, defineStore } from 'pinia'
import { useInitializeStore } from '@/composables/use-initialize-store.ts'

export interface PaymentToOwner {
  id: number
  created_at: string
}

export interface PaymentToOwnerCreate {
  created_by: number
  owner: number
  year: number
  week: number
}

export interface PaymentToOwnerOrders {
  id: number
  created_at: string
}

export interface PaymentToOwnerOrdersCreate {
  created_by: number
  document: number
  order: number
  amount: number
  payment: number
}

export const usePaymentOwnerStore = defineStore('payments_to_owners', () => {
  const mapping = ref(new Map<number, PaymentOwnerCreate | Promise<PaymentOwnerCreate>>())

  const { initialized, loading } = useInitializeStore(async () => {
    const response = await supabase.from('payments_to_owners').select()

    const map = new Map<number, PaymentOwnerCreate>()
    response.data?.forEach((json) => {
      const payment = json as PaymentOwnerCreate
      map.set(payment.id, payment)
    })

    mapping.value = map
  })

  const listing = computedAsync(async () => {
    const list = [] as PaymentOwnerCreate[]

    for (const obj of mapping.value.values()) {
      list.push(await obj)
    }

    return list
  })

  async function create(payment: PaymentToOwnerCreate, records: Array<PaymentToOwnerOrdersCreate>) {
    const response = await supabase
      .from('payments_to_owners')
      .insert(payment)
      .select()
      .throwOnError()

    console.log('response', response)

    if (response.status == 201 && response.data?.length == 1) {
      const payment = response.data[0] as PaymentOwnerCreate
      mapping.value.set(payment.id, payment)
      console.log('payment', payment)

      for (const record of records) {
        record.document = payment.id
      }

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
  import.meta.hot.accept(acceptHMRUpdate(usePaymentOwnerStore, import.meta.hot))
}
