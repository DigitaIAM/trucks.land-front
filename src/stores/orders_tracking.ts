import { acceptHMRUpdate, defineStore } from 'pinia'
import { useInitializeStore } from '@/composables/use-initialize-store.ts'

export interface OrderTracking {
  event: OrderEvent
  order: Order
}

export const useOrdersTracking = defineStore('orders_tracking', () => {
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
          details: (json.event_details as object) || {},
        },
        order: json as Order,
      })
    })

    listing.value = list
  })

  return { initialized, loading, listing }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useOrdersTracking, import.meta.hot))
}
