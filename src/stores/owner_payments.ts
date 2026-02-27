import { acceptHMRUpdate, defineStore } from 'pinia'
import type { KV } from '@/utils/kv.ts'
import { groupBy } from '@/utils/group-by.ts'

export interface PaymentToOwnerSummary {
  id: number
  created_at: string
  created_by: number
  organization: number
  owner: number
  year: number
  week: number
  orders: number
  amount: number
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

export interface PaymentToOwnerSummaryInDetails {
  document: number
  order: Order
  agreements: Array<OrderEvent>
  pickups: Array<OrderEvent>
  deliveries: Array<OrderEvent>
}

export const usePaymentToOwnerStore = defineStore('owner_payments', () => {
  const contextFilters = ref<Array<KV>>([])
  const searchFilters = ref<Array<KV>>([])

  const mapping = ref(new Map<number, PaymentToOwnerSummary | Promise<PaymentToOwnerSummary>>())
  const timestamp = ref(Date.now())

  async function fetching(limit: number): Promise<Map<number, PaymentToOwnerSummary>> {
    let query = supabase.from('owner_payments_journal').select()

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

    query = query.order('created_at', { ascending: false })
    if (limit > 0) {
      query = query.limit(limit)
    }
    const response = await query

    const map = new Map<number, PaymentToOwnerSummary>()
    response.data?.forEach((json) => {
      const payment = json as PaymentToOwnerSummary
      map.set(payment.id, payment)
    })

    return map
  }

  async function fetchingDetails(
    paymentIds: number[],
  ): Promise<Map<number, Array<PaymentToOwnerSummaryInDetails>>> {
    const responsePayments = await supabase
      .from('owner_payment_orders')
      .select()
      .in('doc_payment', paymentIds)

    const ids = (responsePayments.data ?? []).map((v) => v['doc_order'] as number)

    const responseOrders = await supabase.from('orders_journal').select().in('id', ids)
    const orders = groupBy(
      responseOrders.data!.map((v) => v as Order),
      (v) => v.id,
    )

    const responseEvents = await supabase
      .from('order_events')
      .select()
      .in('document', ids)
      .in('kind', ['agreement', 'pick-up', 'delivery'])
    const events = groupBy(
      responseEvents.data!.map((v) => v as OrderEvent),
      (v) => v.document,
    )

    return groupBy(
      (responsePayments.data ?? []).map((record) => {
        const orderId = record['doc_order']

        const order: Order = orders.get(orderId)![0]

        const agreements: Array<OrderEvent> =
          events.get(orderId)?.filter((v) => v.kind === 'agreement') || new Array<OrderEvent>()
        const pickups: Array<OrderEvent> =
          events.get(orderId)?.filter((v) => v.kind === 'pick-up') || new Array<OrderEvent>()
        const deliveries: Array<OrderEvent> =
          events.get(orderId)?.filter((v) => v.kind === 'delivery') || new Array<OrderEvent>()

        return {
          document: record['doc_payment'],
          order: order,
          agreements: agreements,
          pickups: pickups,
          deliveries: deliveries,
        } as PaymentToOwnerSummaryInDetails
      }),
      (v) => v.document,
    )
  }

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
    const response = await supabase.from('owner_payments').insert(payment).select().throwOnError()

    //console.log('response', response)

    if (response.status == 201 && response.data?.length == 1) {
      const payment = response.data[0] as PaymentToOwner
      mapping.value.set(payment.id, payment as PaymentToOwnerSummary)
      // console.log('payment', payment)

      for (const record of paymentRecords) {
        record.doc_payment = payment.id
      }

      for (const record of expenseRecords) {
        record.doc_payment = payment.id
      }

      await supabase.from('owner_payment_orders').insert(paymentRecords).select().throwOnError()

      await supabase.from('owner_payment_expenses').insert(expenseRecords).select().throwOnError()
    } else {
      throw 'unexpended response status: ' + response.status
    }
  }

  async function search(text: string) {
    const response = await supabase
      .from('owner_payments_journal')
      .select()
      .ilike('week', '%' + text + '%')
      .limit(10)

    if (response.status == 200) {
      return response.data?.map((json) => json as PaymentToOwnerSummary) ?? []
    }

    return []
  }

  async function setContext(filters: Array<KV>) {
    contextFilters.value = filters

    await _setFilters()
  }

  async function setFilters(filters: Array<KV>) {
    searchFilters.value = filters

    await _setFilters()
  }

  async function _setFilters() {
    const localTime = Date.now()
    if (timestamp.value > localTime) {
      return
    }
    timestamp.value = localTime

    mapping.value = new Map<number, PaymentToOwnerSummary>()

    const map = await fetching(searchFilters.value.length === 0 ? 20 : 100)

    if (timestamp.value == localTime) {
      mapping.value = map
    }
  }

  return {
    fetching,
    fetchingDetails,
    listing,
    create,
    search,
    setContext,
    setFilters,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePaymentToOwnerStore, import.meta.hot))
}
