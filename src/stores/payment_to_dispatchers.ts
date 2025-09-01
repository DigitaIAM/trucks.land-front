import { acceptHMRUpdate, defineStore } from 'pinia'
import type { PaymentToDispatcherOrderCreate } from '@/stores/payment_to_dispatchers_orders.ts'

export interface PaymentToDispatcherSummary {
  id: number
  created_at: string
  created_by: number
  organization: number
  dispatcher: number
  month: number
  year: number
  number_of_orders: number
  amount: number
  payment: number
  to_pay: number
  percent_of_gross: number
  percent_of_driver: number
}

export interface PaymentToDispatcher extends PaymentToDispatcherCreate {
  id: number
  created_at: string
}

export interface PaymentToDispatcherCreate {
  created_by: number
  organization: number
  dispatcher: number
  month: number
  year: number
  percent_of_gross: number
  percent_of_driver: number
}

export const usePaymentToDispatcherStore = defineStore('payments_to_dispatchers', () => {
  const mapping = ref(
    new Map<number, PaymentToDispatcherSummary | Promise<PaymentToDispatcherSummary>>(),
  )

  const { initialized, loading } = useInitializeStore(async () => {
    const response = await supabase.from('payment_to_dispatchers_journal').select()

    const map = new Map<number, PaymentToDispatcherSummary>()
    response.data?.forEach((json) => {
      const payment = json as PaymentToDispatcherSummary
      map.set(payment.id, payment)
    })

    mapping.value = map
  })

  const listing = computedAsync(async () => {
    const list = [] as PaymentToDispatcherSummary[]

    for (const obj of mapping.value.values()) {
      list.push(await obj)
    }
    // console.log('list', list)
    return list
  })

  async function create(
    payment: PaymentToDispatcherCreate,
    records: Array<PaymentToDispatcherOrderCreate>,
  ) {
    const response = await supabase
      .from('payments_to_dispatchers')
      .insert(payment)
      .select()
      .throwOnError()
    //
    // console.log('response', response)

    if (response.status == 201 && response.data?.length == 1) {
      const payment = response.data[0] as PaymentToDispatcher
      mapping.value.set(payment.id, payment)

      // console.log('payment', payment)

      for (const record of records) {
        record.document = payment.id
      }

      // console.log('records', records)

      const responseRecords = await supabase
        .from('payments_to_dispatchers_orders')
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
  import.meta.hot.accept(acceptHMRUpdate(usePaymentToDispatcherStore, import.meta.hot))
}
