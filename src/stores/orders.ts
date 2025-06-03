import { acceptHMRUpdate, defineStore } from 'pinia'
import { useInitializeStore } from '@/composables/use-initialize-store.ts'

export interface Order extends OrderCreate {
  id: number
  created_at: string
}

export interface OrderCreate {
  organization: number
  dispatcher: number
  refs: string
  broker: number
  cost: string
  spend: string
  status: number
}

export interface OrderUpdate {
  organization?: number
  dispatcher?: number
  refs?: string
  broker?: number
  driver?: number
  vehicle?: number
  cost?: string
  spend?: string
  status?: number
  note?: string
}

export const useOrdersStore = defineStore('order', () => {
  const mapping = ref(new Map<number, Order>())

  const { initialized, loading } = useInitializeStore(async () => {
    const response = await supabase.from('orders').select()

    const map = new Map<number, Order>()
    response.data?.forEach((json) => {
      const order = json as Order
      map.set(order.id, order)
    })

    mapping.value = map
  })

  const listing = computed(() => {
    const list = [] as Order[]

    mapping.value.forEach((v) => {
      list.push(v)
    })

    return list
  })

  async function create(order: OrderCreate) {
    console.log('create', order)
    const response = await supabase.from('orders').insert(order).select().throwOnError()

    if (response.status == 201) {
      response.data?.forEach((json) => {
        const order = json as Order
        mapping.value.set(order.id, order)
      })
    } else {
      throw 'unexpended response status: ' + response.status
    }
  }

  function update(id: number, order: OrderUpdate) {
    supabase
      .from('orders')
      .update(order)
      .eq('id', id)
      .select()
      .then((response) => {
        if (response.status == 200) {
          response.data?.forEach((json) => {
            const order = json as Order
            mapping.value.set(order.id, order)
          })
        }
      })
  }

  function resolve(id: number) {
    return mapping.value.get(id)
  }

  async function search(text: string) {
    const response = await supabase
      .from('orders')
      .select()
      .ilike('name', '%' + text + '%')

    if (response.status == 200) {
      return response.data?.map((json) => json as Order)
    }

    return []
  }

  return { initialized, loading, listing, create, update, resolve, search }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useOrdersStore, import.meta.hot))
}
