import { acceptHMRUpdate, defineStore } from 'pinia'

export interface Order extends OrderCreate {
  id: number
  created_at: string
  driver_cost: number
  status: number
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
  excluded?: boolean
}

export interface OrderStatus {
  id: number
  created_at: string
  document: number
  status: number
  user: number
}

export interface KV {
  key: string
  val: never
}

export const useOrdersStore = defineStore('order', () => {
  const contextFilters = ref<Array<KV>>([])
  const searchFilters = ref<Array<KV>>([])

  const mapping = ref(new Map<number, Order>())
  const timestamp = ref(Date.now())

  const changes = supabase
    .channel('realtime_order_statuses_channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'order_statuses',
      },
      (payload) => {
        if (payload.eventType == 'INSERT') {
          const nextStatus = payload.new as OrderStatus

          const order = mapping.value.get(nextStatus.document)
          if (order) {
            const map = new Map<number, Order>(mapping.value)

            order.status = nextStatus.status
            map.set(order.id, order)

            mapping.value = map
          }
        }
      },
    )
    .subscribe()

  const listing = computed(() => {
    const list = [] as Order[]

    mapping.value.forEach((v) => list.push(v))

    return list
  })

  function reset() {
    mapping.value = new Map<number, Order>()
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
    mapping.value = new Map<number, Order>()

    const localTime = Date.now()

    if (timestamp.value > localTime) {
      return
    }
    timestamp.value = localTime

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

    if (timestamp.value == localTime) {
      const map = new Map<number, Order>()
      response.data?.forEach((json) => {
        const order = json as Order
        map.set(order.id, order)
      })

      mapping.value = map
    }
  }

  async function create(order: OrderCreate, user: User, status: Status) {
    const response = await supabase.from('orders').insert(order).select() // .throwOnError()
    if (response.status == 201 && response.data?.length == 1) {
      const order = response.data[0] as Order
      mapping.value.set(order.id, order)

      return await changeStatus(order, user, status)
    } else {
      console.log('error', response)
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

  async function changeStatus(order: Order, user: User, status: Status) {
    const response = await supabase
      .from('order_statuses')
      .insert({
        document: order.id,
        user: user.id,
        status: status.id,
      })
      .select()

    if (response.status == 201 && response.data?.length == 1) {
      order.status = status.id

      const map = new Map<number, Order>(mapping.value)
      map.set(order.id, order)
      mapping.value = map

      return order
    } else {
      console.log('error', response)
      throw 'unexpended response status: ' + response.status
    }
  }

  async function resolve(id: number) {
    const order = mapping.value.get(id)
    if (order) {
      return order
    }

    const response = await supabase.from('orders_journal').select().eq('id', id)

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

  return {
    reset,
    setContext,
    setFilters,
    create,
    listing,
    update,
    changeStatus,
    resolve,
    search,
    changes,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useOrdersStore, import.meta.hot))
}
