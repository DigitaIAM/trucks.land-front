import { acceptHMRUpdate, defineStore } from 'pinia'
import type { Order } from '@/stores/orders.ts'

export interface DriverPaymentRecord {
  driver: number
  vehicle: number
  kind: string
  cost: number
  order: Order
}

export interface DriverPaymentSummary {
  driver: number
  payments: number
  paymentsByOrder: Map<number, number>
  expenses: number
  expensesByOrder: Map<number, number>
  vehiclesByOrder: Map<number, [number]>
  number_of_orders: number
  amount_in_orders: number
  orders: Map<number, Order>
}

export const useReportDriver = defineStore('report_current_driver_payments', () => {
  const mapping = ref(new Map<number, Array<DriverPaymentRecord>>())

  const { initialized, loading } = useInitializeStore(async () => {
    const response = await supabase.from('report_current_driver_payments').select()

    const map = new Map<number, Array<DriverPaymentRecord>>()
    response.data?.forEach((json) => {
      const record = {
        driver: json['oe_driver'],
        vehicle: json['oe_vehicle'],
        kind: json['oe_kind'],
        cost: json['oe_cost'],
        order: json as Order,
      } as DriverPaymentRecord

      const key = record.driver
      const list = map.get(key) ?? []
      list.push(record)
      map.set(key, list)
    })

    mapping.value = map
  })

  const drivers = computed(() => {
    const list = [] as DriverPaymentSummary[]

    const map = mapping.value
    for (const entry of map.entries()) {
      const driver = entry[0]

      const orders = new Map<number, Order>()
      const paymentsByOrder = new Map<number, number>()
      const expensesByOrder = new Map<number, number>()
      const vehiclesByOrder = new Map<number, [number]>()
      // let payments = new Map<number, number>()
      let payments = 0
      let expenses = 0

      entry[1].forEach((p) => {
        const vehicles = vehiclesByOrder.get(p.order.id) ?? []
        if (!vehicles.includes(p.vehicle)) {
          vehicles.push(p.vehicle)
        }
        vehiclesByOrder.set(p.order.id, vehicles)

        if (p.kind === 'agreement') {
          payments += p.cost

          const num = paymentsByOrder.get(p.order.id) ?? 0
          paymentsByOrder.set(p.order.id, num + p.cost)
        } else {
          expenses += p.cost

          const num = expensesByOrder.get(p.order.id) ?? 0
          expensesByOrder.set(p.order.id, num + p.cost)
        }
        orders.set(p.order.id, p.order)
      })

      const amount_in_orders = orders.values().reduce<number>((s, v) => s + v.cost, 0)
      // const profit_in_orders = orders.values().reduce<number>((s, v) => s + v.cost, 0)

      list.push({
        driver: driver,
        payments: payments,
        paymentsByOrder: paymentsByOrder,
        expenses: expenses,
        expensesByOrder: expensesByOrder,
        vehiclesByOrder: vehiclesByOrder,
        number_of_orders: orders.size,
        amount_in_orders: amount_in_orders,
        orders: orders,
      } as DriverPaymentSummary)
    }

    return list
  })

  return { initialized, loading, drivers }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useReportDriver, import.meta.hot))
}
