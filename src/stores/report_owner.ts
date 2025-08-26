import type { Order } from '@/stores/orders.ts'
import { acceptHMRUpdate, defineStore } from 'pinia'

export interface OwnerPaymentRecord {
  owner: number
  driver_payment: number
  order: Order
}

export interface OwnerPaymentSummary {
  owner: number
  orders_number: number
  orders_amount: number
  orders_driver: number
  orders: Map<number, Order>
  paymentsByOrder: Map<number, number>
}

export const useReportOwner = defineStore('report_current_owners_payments', () => {
  const org = ref<number | null>(null)
  const mapping = ref(new Map<number, Array<OwnerPaymentRecord>>())
  const processing = ref<Array<number>>([])

  async function loading(orgId: number | null) {
    org.value = orgId
    const response = await supabase
      .from('report_current_owners_payments')
      .select()
      .eq('organization', orgId)

    const map = new Map<number, Array<OwnerPaymentRecord>>()
    response.data?.forEach((json) => {
      const record = {
        owner: json['owner'],
        driver_payment: json['driver_cost'],
        order: json as Order,
      } as OwnerPaymentRecord

      const key = record.owner
      const list = map.get(key) ?? []
      list.push(record)
      map.set(key, list)
    })
    mapping.value = map
  }

  const owners = computed(() => {
    const list = [] as OwnerPaymentSummary[]

    const map = mapping.value
    for (const entry of map.entries()) {
      const owner = entry[0]

      let orders_amount = 0
      let owner_payment = 0

      const orders = new Map<number, Order>()
      const paymentsByOrder = new Map<number, number>()

      entry[1].forEach((p) => {
        orders_amount += p.order.cost
        owner_payment += p.driver_payment

        const num = paymentsByOrder.get(p.order.id) ?? 0
        paymentsByOrder.set(p.order.id, num + p.driver_payment)

        orders.set(p.order.id, p.order)
      })

      list.push({
        owner: owner,
        orders_number: orders.size,
        orders_amount: orders_amount,
        orders_driver: owner_payment,
        orders: orders,
        paymentsByOrder: paymentsByOrder,
      } as OwnerPaymentSummary)
    }

    // console.log('list', list)
    return list
  })

  async function createPayment(org: number, year: number, week: number, account: User) {
    const paymentToOwnerStore = usePaymentToOwnerStore()

    const data = owners.value.slice()
    for (const summary of data) {
      mapping.value.delete(processing.value[1])

      processing.value = [summary.owner, processing.value[0]]

      const records = []

      for (const order of summary.orders.values()) {
        const payment = summary.paymentsByOrder.get(order.id)

        records.push({
          created_by: account.id,
          document: -1,
          doc_order: order.id,
          amount: order.cost,
          payment: payment,
        } as PaymentToOwnerOrderCreate)
      }

      await paymentToOwnerStore.create(
        {
          created_by: account.id,
          organization: org,
          owner: summary.owner,
          year: year,
          week: week,
        } as PaymentToOwnerCreate,
        records,
      )
    }

    mapping.value.clear()
    processing.value = []
  }

  return { loading, owners, processing, createPayment }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useReportOwner, import.meta.hot))
}
