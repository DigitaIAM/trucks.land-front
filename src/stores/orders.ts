import { acceptHMRUpdate, defineStore } from 'pinia'
import { useInitializeStore } from '@/composables/use-initialize-store.ts'

export interface Order extends OrderCreate {
  id: number
  created_at: string
}

export interface OrderCreate {
  dispatcher: number
  posted_loads: string
  refs: string
  organization: number
  broker: number
  total_pieces: number
  total_weight: number
  total_miles: number
  cost: number
  status: number
}

export interface OrderUpdate {
  dispatcher?: number
  posted_loads?: string
  refs?: string
  organization?: number
  broker?: number
  total_pieces?: number
  total_weight?: number
  total_miles?: number
  cost?: number
  status?: number
}

export const useOrdersStore = defineStore('order', () => {
  const mapping = ref(new Map<number, Order>())

  const { initialized, loading } = useInitializeStore(async () => {
    const response = await supabase.from('orders').select().order('created_at').limit(50)

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
    const response = await supabase.from('orders').insert(order).select() // .throwOnError()
    console.log(response)

    if (response.status == 201 && response.data?.length == 1) {
      const order = response.data[0] as Order
      // mapping.value.set(order.id, order)
      return order.id
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

  async function resolve(id: number) {
    const order = mapping.value.get(id)
    if (order) {
      return order
    }

    const response = await supabase.from('orders').select().eq('id', id)

    const map = new Map<number, Order>()
    response.data?.forEach((json) => {
      const order = json as Order
      map.set(order.id, order)
    })

    return map.get(id)
  }

  async function search(text: string) {
    const response = await supabase
      .from('orders')
      .select()
      .ilike('name', '%' + text + '%')
      .limit(10)

    if (response.status == 200) {
      return response.data?.map((json) => json as Order)
    }

    return []
  }

  return { initialized, loading, create, listing, update, resolve, search }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useOrdersStore, import.meta.hot))
}
