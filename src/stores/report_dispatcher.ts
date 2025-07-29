import { acceptHMRUpdate, defineStore } from 'pinia'
import type { Order } from '@/stores/orders.ts'

export interface DispatcherPaymentRecord {
  dispatcher: number
  driver_payment: number
  dispatcher_payment: number
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
}

export const useReportDispatcher = defineStore('report_current_dispatcher_payments', () => {
  const mapping = ref(new Map<number, Array<DispatcherPaymentRecord>>())

  const { initialized, loading } = useInitializeStore(async () => {
    const response = await supabase.from('report_current_dispatcher_payments').select()

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
  })

  const dispatchers = computed(() => {
    const list = [] as DispatcherPaymentSummary[]

    const map = mapping.value
    for (const entry of map.entries()) {
      const dispatcher = entry[0]

      let orders_amount = 0
      let orders_driver = 0
      let orders_profit = 0
      let toPayment = 0

      const orders = new Map<number, Order>()
      const paymentsByOrder = new Map<number, number>()

      entry[1].forEach((p) => {
        if (p.order.excluded) {
          p.dispatcher_payment = 0
        } else {
          const profit = p.order.cost - p.driver_payment
          orders_amount += p.order.cost
          orders_driver += p.driver_payment
          orders_profit += profit

          const payment = (profit * 5.0) / 100.0
          p.dispatcher_payment = payment
          toPayment += payment
        }

        const num = paymentsByOrder.get(p.order.id) ?? 0
        paymentsByOrder.set(p.order.id, num + p.driver_payment)

        orders.set(p.order.id, p.order)
      })

      list.push({
        dispatcher: dispatcher,
        orders_number: orders.size,
        orders_amount: orders_amount,
        orders_driver: orders_driver,
        orders_profit: orders_profit,
        toPayment: toPayment,
        orders: orders,
        paymentsByOrder: paymentsByOrder,
      } as DispatcherPaymentSummary)
    }

    console.log('list', list)
    return list
  })

  return { initialized, loading, dispatchers }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useReportDispatcher, import.meta.hot))
}
