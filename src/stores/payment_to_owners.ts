import { acceptHMRUpdate, defineStore } from 'pinia'
import type { PaymentToOwnerOrderCreate } from '@/stores/payment_to_owners_orders.ts'
import type { Order } from '@/stores/orders.ts'
import type { Event } from '@/stores/events.ts'

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

export interface PaymentToOwnerSummaryInDetails {
  order: Order
  agreements: Array<Event>
  pickups: Array<Event>
  deliveries: Array<Event>
}

export interface KV {
  key: string
  val: never
}

export const usePaymentToOwnerStore = defineStore('payments_to_owners', () => {
  const contextFilters = ref<Array<KV>>([])
  const searchFilters = ref<Array<KV>>([])

  const mapping = ref(new Map<number, PaymentToOwnerSummary | Promise<PaymentToOwnerSummary>>())
  const timestamp = ref(Date.now())

  const { initialized, loading } = useInitializeStore(async () => {
    const response = await supabase
      .from('payments_to_owners_journal')
      .select()
      .order('created_at', { ascending: false })

    // console.log('response', response)

    const map = new Map<number, PaymentToOwnerSummary>()
    response.data?.forEach((json) => {
      const payment = json as PaymentToOwnerSummary
      map.set(payment.id, payment)
    })

    mapping.value = map
  })

  async function fetchingDetails(
    paymentId: number,
  ): Promise<Array<PaymentToOwnerSummaryInDetails>> {
    const list = [] as Array<PaymentToOwnerSummaryInDetails>

    const responsePayment = await supabase
      .from('payments_to_owners_orders')
      .select()
      .eq('document', paymentId)

    for (const record of responsePayment.data ?? []) {
      const orderId = record['doc_order']
      const responseOrder = await supabase
        .from('orders_journal')
        .select()
        .eq('id', orderId)
        .single()

      const order = responseOrder.data as Order

      const responseAgreement = await supabase
        .from('order_events')
        .select()
        .eq('document', order.id)
        .eq('kind', 'agreement')

      const agreements = Array.from((responseAgreement.data ?? []).map((json) => json as Event))

      const responsePickup = await supabase
        .from('order_events')
        .select()
        .eq('document', order.id)
        .eq('kind', 'pick-up')

      const pickups = Array.from((responsePickup.data ?? []).map((json) => json as Event))

      const responseDelivery = await supabase
        .from('order_events')
        .select()
        .eq('document', order.id)
        .eq('kind', 'delivery')

      const deliveries = Array.from((responseDelivery.data ?? []).map((json) => json as Event))

      list.push({
        order: order,
        agreements: agreements,
        pickups: pickups,
        deliveries: deliveries,
      } as PaymentToOwnerSummaryInDetails)
    }
    return list
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

  async function search(text: string) {
    const response = await supabase
      .from('payments_to_owners_journal')
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
    mapping.value = new Map<number, PaymentToOwnerSummary>()

    const localTime = Date.now()

    if (timestamp.value > localTime) {
      return
    }
    timestamp.value = localTime

    let query = supabase.from('payments_to_owners_journal').select()

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
      const map = new Map<number, PaymentToOwnerSummary>()
      response.data?.forEach((json) => {
        const payment = json as PaymentToOwnerSummary
        map.set(payment.id, payment)
      })

      mapping.value = map
    }
  }

  return {
    initialized,
    fetchingDetails,
    loading,
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
