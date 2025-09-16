import { acceptHMRUpdate, defineStore } from 'pinia'
import type { Order } from '@/stores/orders.ts'
import type { PaymentToDispatcherCreate } from '@/stores/payment_to_dispatchers.ts'

export interface DispatcherPaymentRecord {
  dispatcher: number
  driver_payment: number
  order: Order
}

export interface DispatcherPaymentSummary {
  dispatcher: number
  orders_number: number
  orders_amount: number
  orders_driver: number
  orders_profit: number
  toPayment: number
  orders: Map<number, Order>
  paymentsByOrder: Map<number, number>
  paymentTerms: PaymentTerms
}

export interface PaymentTerms {
  created_by: number
  organization: number
  user: number
  percent_of_gross: number
  percent_of_driver: number
}

export const useReportDispatcher = defineStore('report_current_dispatcher_payments', () => {
  const org = ref<number | null>(null)
  const mapping = ref(new Map<number, Array<DispatcherPaymentRecord>>())
  const processing = ref<Array<number>>([])

  async function loading(orgId: number | null) {
    org.value = orgId
    const response = await supabase
      .from('report_current_dispatcher_payments')
      .select('*')
      .eq('organization', orgId)

    const map = new Map<number, Array<DispatcherPaymentRecord>>()
    response.data?.forEach((json) => {
      const record = {
        dispatcher: json['dispatcher'],
        driver_payment: json['driver_payment'],
        dispatcher_payment: 0,
        order: json as Order,
      } as DispatcherPaymentRecord

      const key = record.dispatcher
      const list = map.get(key) ?? []
      list.push(record)
      map.set(key, list)
    })
    mapping.value = map
  }

  const dispatchers = computedAsync(async () => {
    const list = [] as DispatcherPaymentSummary[]

    const map = mapping.value
    for (const entry of map.entries()) {
      const dispatcher = entry[0]

      let orders_amount = 0
      let orders_driver = 0
      let orders_profit = 0

      const orders = new Map<number, Order>()
      const paymentsByOrder = new Map<number, number>()

      const response = await supabase
        .from('conditions')
        .select()
        .eq('user', dispatcher)
        .eq('organization', org.value)
        .maybeSingle()

      const paymentTerms = response.data as PaymentTerms

      entry[1].forEach((p) => {
        if (p.order.excluded) {
          // ignore
        } else {
          const profit = p.order.cost - p.driver_payment
          orders_amount += p.order.cost
          orders_driver += p.driver_payment
          orders_profit += profit
        }

        const num = paymentsByOrder.get(p.order.id) ?? 0
        paymentsByOrder.set(p.order.id, num + p.driver_payment)

        orders.set(p.order.id, p.order)
      })

      let toPayment = 0
      if (paymentTerms.percent_of_gross) {
        toPayment += (orders_amount * paymentTerms.percent_of_gross) / 100
      } else if (paymentTerms.percent_of_driver) {
        toPayment += (orders_driver * paymentTerms.percent_of_driver) / 100
      }

      list.push({
        dispatcher: dispatcher,
        orders_number: orders.size,
        orders_amount: orders_amount,
        orders_driver: orders_driver,
        orders_profit: orders_profit,
        toPayment: toPayment,
        orders: orders,
        paymentsByOrder: paymentsByOrder,
        paymentTerms: paymentTerms,
      } as DispatcherPaymentSummary)
    }

    return list
  }, [])

  async function createPayment(
    org: number,
    year: number,
    month: number,
    account: User,
    ex_rate: number,
  ) {
    const paymentToDispatcherStore = usePaymentToDispatcherStore()

    const data = dispatchers.value.slice()
    for (const summary of data) {
      mapping.value.delete(processing.value[1])

      processing.value = [summary.dispatcher, processing.value[0]]

      const records = []

      for (const order of summary.orders.values()) {
        const payment = summary.paymentsByOrder.get(order.id)

        records.push({
          created_by: account.id,
          document: -1,
          doc_order: order.id,
          amount: order.cost,
          payment: payment,
        } as PaymentToDispatcherOrderCreate)
      }

      await paymentToDispatcherStore.create(
        {
          created_by: account.id,
          organization: org,
          dispatcher: summary.dispatcher,
          month: month,
          year: year,
          percent_of_gross: summary.paymentTerms.percent_of_gross,
          percent_of_driver: summary.paymentTerms.percent_of_driver,
          to_pay: summary.toPayment,
          ex_rate: ex_rate,
        } as PaymentToDispatcherCreate,
        records,
      )
    }

    mapping.value.clear()
    processing.value = []
  }

  return { loading, dispatchers, processing, createPayment }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useReportDispatcher, import.meta.hot))
}
