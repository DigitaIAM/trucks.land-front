import { acceptHMRUpdate, defineStore } from 'pinia'
import { useInitializeStore } from '@/composables/use-initialize-store.ts'

export interface Order extends OrderCreate {
  id: number
  created_at: string
  driver_cost: number
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
  excluded: boolean
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
  excluded?: boolean
}

export interface KV {
  key: string
  val: never
}

export const useOrdersStore = defineStore('order', () => {
  const contextFilters = ref<Array<KV>>([])
  const searchFilters = ref<Array<KV>>([])

  const mapping = ref(new Map<number, Order>())

  // const { initialized, loading } = useInitializeStore(async () => {
  //   let query = supabase.from('orders_journal').select()
  //
  //   activeFilters.value.map((f) => (query = query.eq(f.key, f.val.id)))
  //
  //   const response = await query.order('created_at').limit(50)
  //
  //   const map = new Map<number, Order>()
  //   response.data?.forEach((json) => {
  //     const order = json as Order
  //     map.set(order.id, order)
  //   })
  //
  //   mapping.value = map
  // })

  const listing = computed(() => {
    const list = [] as Order[]

    mapping.value.forEach((v) => {
      list.push(v)
    })

    return list
  })

  async function setContext(filters: Array<KV>) {
    contextFilters.value = filters

    await _setFilters()
  }

  async function setFilters(filters: Array<KV>) {
    searchFilters.value = filters

    await _setFilters()
  }

  async function _setFilters() {
    let query = supabase.from('orders_journal').select()

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

    const response = await query.order('created_at').limit(50)

    const map = new Map<number, Order>()
    response.data?.forEach((json) => {
      const order = json as Order
      map.set(order.id, order)
    })

    mapping.value = map
  }

  async function create(order: OrderCreate) {
    const response = await supabase.from('orders').insert(order).select() // .throwOnError()

    if (response.status == 201 && response.data?.length == 1) {
      const order = response.data[0] as Order
      // mapping.value.set(order.id, order)
      return order.id
    } else {
      throw 'unexpended response status: ' + response.status
    }
  }

  async function update(id: number, order: OrderUpdate) {
    await supabase
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

  return { setContext, setFilters, create, listing, update, resolve, search } // initialized, loading,
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useOrdersStore, import.meta.hot))
}
