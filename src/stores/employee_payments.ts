import { acceptHMRUpdate, defineStore } from 'pinia'
import type { PaymentToDispatcherOrderCreate } from '@/stores/employee_payment_orders.ts'
import type { KV } from '@/utils/kv.ts'
import type { Order } from '@/stores/orders.ts'
import type { EmployeePaymentSettlements } from '@/stores/employee_payment_settlements.ts'

export interface PaymentToDispatcherSummary {
  id: number
  created_at: string
  created_by: number
  dispatcher: number
  number_of_orders: number
  gross: number
  percent_of_gross: number
  payment: number
  settlement: number
  to_pay: number
  ex_rate: number
  income_tax: number
  year: number
  month: number
}

export interface PaymentToDispatcher extends PaymentToDispatcherCreate {
  id: number
  created_at: string
}

export interface PaymentToDispatcherCreate {
  created_by: number
  organization: number
  dispatcher: number
  year: number
  month: number
  percent_of_gross: number
  percent_of_driver: number
  to_pay: number
  ex_rate: number
  income_tax: number
}

export interface PaymentToDispatcherSummaryDetails {
  order: Order
}

export const usePaymentToDispatcherStore = defineStore('employee_payments', () => {
  const contextFilters = ref<Array<KV>>([])
  const searchFilters = ref<Array<KV>>([])

  const mapping = ref(
    new Map<number, PaymentToDispatcherSummary | Promise<PaymentToDispatcherSummary>>(),
  )
  const timestamp = ref(Date.now())

  async function setContext(filters: Array<KV>) {
    contextFilters.value = filters

    await _setFilters()
  }

  async function setFilters(filters: Array<KV>) {
    searchFilters.value = filters

    await _setFilters()
  }

  async function _setFilters() {
    mapping.value = new Map<number, Order>()

    const localTime = Date.now()

    if (timestamp.value > localTime) {
      return
    }
    timestamp.value = localTime

    let query = supabase.from('payment_to_dispatchers_journal').select()

    contextFilters.value.concat(searchFilters.value).forEach((f) => {
      const x = f.val
      if (typeof x === 'object' && !Array.isArray(x) && x !== null) {
        query = query.eq(f.key, x.id)
      } else if (Array.isArray(x)) {
        query = query.in(f.key, x)
      } else {
        query = query.eq(f.key, x)
      }
    })

    const response = await query.order('created_at', { ascending: false }).limit(50)

    if (timestamp.value == localTime) {
      const map = new Map<number, PaymentToDispatcherSummary>()
      response.data?.forEach((json) => {
        const payment = json as PaymentToDispatcherSummary
        map.set(payment.id, payment)
      })

      mapping.value = map
    }
  }

  async function fetchingOrder(
    paymentId: number,
  ): Promise<Array<PaymentToDispatcherSummaryDetails>> {
    const list = [] as Array<PaymentToDispatcherSummaryDetails>

    const responsePayment = await supabase
      .from('employee_payment_orders')
      .select()
      .eq('doc_payment', paymentId)

    for (const record of responsePayment.data ?? []) {
      const orderId = record['doc_order']
      const responseOrder = await supabase
        .from('orders_journal')
        .select()
        .eq('id', orderId)
        .single()

      const order = responseOrder.data as Order

      list.push({
        order: order,
      } as PaymentToDispatcherSummaryDetails)
    }
    return list
  }

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
    settlementsRecords: Array<EmployeePaymentSettlements>,
  ) {
    const response = await supabase
      .from('employee_payments')
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
        record.doc_payment = payment.id
      }

      // console.log('records', records)

      for (const recordSettlement of settlementsRecords) {
        recordSettlement.doc_payment = payment.id
      }

      const responseRecords = await supabase
        .from('employee_payment_orders')
        .insert(records)
        .select()
        .throwOnError()

      await supabase
        .from('employee_payment_settlements')
        .insert(settlementsRecords)
        .select()
        .select()
        .throwOnError()

      console.log('responseRecords', responseRecords)
    } else {
      throw 'unexpended response status: ' + response.status
    }
  }

  return { setContext, setFilters, fetchingOrder, listing, create }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePaymentToDispatcherStore, import.meta.hot))
}
