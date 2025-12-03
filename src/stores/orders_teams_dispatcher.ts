import { acceptHMRUpdate, defineStore } from 'pinia'
import { useInitializeStore } from '@/composables/use-initialize-store.ts'

export interface OrdersTeamsDispatcher {
  order: Order
  team: string
}

export const useOrdersTeamsDispatcherStore = defineStore('orders_teams_dispatcher', () => {
  const listing = ref(new Array<OrdersTeamsDispatcher>())

  const { initialized, loading } = useInitializeStore(async () => {
    const response = await supabase.from('orders_teams_dispatcher').select()

    const list = [] as Array<OrdersTeamsDispatcher>
    response.data?.forEach((json) => {
      list.push(<OrdersTeamsDispatcher>{
        order: json as Order,
        team: json.team,
      })
    })

    listing.value = list
  })

  return { initialized, loading, listing }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useOrdersTeamsDispatcherStore, import.meta.hot))
}
