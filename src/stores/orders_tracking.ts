import { acceptHMRUpdate, defineStore } from 'pinia'
import { useInitializeStore } from '@/composables/use-initialize-store.ts'
import type { KV } from '@/utils/kv.ts'

export interface OrderTracking {
  event: OrderEvent
  order: Order
}

export const useOrdersTracking = defineStore('orders_tracking', () => {
  const contextFilters = ref<Array<KV>>([])
  const searchFilters = ref<Array<KV>>([])

  const timestamp = ref(Date.now())
  const listing = ref(new Array<OrderTracking>())

  const { initialized, loading } = useInitializeStore(async () => {
    const response = await supabase.from('orders_tracking').select()

    const list = [] as Array<OrderTracking>
    response.data?.forEach((json) => {
      list.push(<OrderTracking>{
        event: <OrderEvent>{
          id: json.event_id,
          created_at: json.event_created_at,
          created_by: json.event_created_by,
          kind: json.event_kind,
          datetime: json.event_datetime,
          address: json.event_address,
          city: json.event_city,
          state: json.event_state,
          zip: json.event_zip,
          details: (json.event_details as object) || {}
        },
        order: json as Order
      })
    })

    listing.value = list
  })

  async function setFilters(filters: Array<KV>) {
    searchFilters.value = filters

    await _setFilters()
  }

  async function _setFilters() {
    listing.value = []

    const localTime = Date.now()

    if (timestamp.value > localTime) {
      return
    }
    timestamp.value = localTime

    let query = supabase.from('orders_tracking').select()

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

    const response = await query

    if (timestamp.value == localTime) {
      const list = [] as Array<OrderTracking>
      response.data?.forEach((json) => {
        list.push(<OrderTracking>{
          event: <OrderEvent>{
            id: json.event_id,
            created_at: json.event_created_at,
            created_by: json.event_created_by,
            kind: json.event_kind,
            datetime: json.event_datetime,
            address: json.event_address,
            city: json.event_city,
            state: json.event_state,
            zip: json.event_zip,
            details: (json.event_details as object) || {}
          },
          order: json as Order
        })
      })

      listing.value = list
    }
  }

  return { initialized, loading, listing, setFilters }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useOrdersTracking, import.meta.hot))
}
