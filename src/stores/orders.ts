import { acceptHMRUpdate, defineStore } from 'pinia'
import type { KV } from '@/utils/kv.ts'

export interface Order extends OrderCreate {
  id: number
  number: number
  created_at: string
  driver_cost: number
  stage: number
}

export interface OrderCreate {
  created_by: number
  organization: number
  posted_loads: string
  refs: string
  broker: number
  total_pieces: number
  total_weight: number
  total_miles: number
  cost: number
  excluded: boolean
}

export interface OrderUpdate {
  created_by?: number
  organization?: number
  posted_loads?: string
  refs?: string
  broker?: number
  total_pieces?: number
  total_weight?: number
  total_miles?: number
  cost?: number
  excluded?: boolean
}

export interface OrderStage {
  id: number
  created_at: string
  created_by: number
  document: number
  stage: number
}

export const useOrdersStore = defineStore('orders', () => {
  const contextFilters = ref<Array<KV>>([])
  const searchFilters = ref<Array<KV>>([])

  const mapping = ref(new Map<number, Order>())
  const timestamp = ref(Date.now())

  const changes = supabase
    .channel('realtime_order_stages_channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'order_stages'
      },
      (payload) => {
        if (payload.eventType == 'INSERT') {
          const nextStatus = payload.new as OrderStage

          const order = mapping.value.get(nextStatus.document)
          if (order) {
            const map = new Map<number, Order>(mapping.value)

            order.stage = nextStatus.stage
            map.set(order.id, order)

            mapping.value = map
          }
        }
      }
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

    let limit = 20

    contextFilters.value.concat(searchFilters.value).forEach((f) => {
      const x = f.val
      if (f.key === 'limit') {
        limit = f.val
      } else if (typeof x === 'object' && !Array.isArray(x) && x !== null) {
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

    if (timestamp.value == localTime) {
      const map = new Map<number, Order>()
      response.data?.forEach((json) => {
        const order = json as Order
        map.set(order.id, order)
      })

      mapping.value = map
    }
  }

  async function create(order: OrderCreate, status: Status) {
    const response = await supabase.from('orders').insert(order).select() // .throwOnError()
    if (response.status == 201 && response.data?.length == 1) {
      const order = response.data[0] as Order
      mapping.value.set(order.id, order)

      return await changeStatus(order, status)
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

  async function changeStatus(order: Order, stage: Status) {
    const response = await supabase
      .from('order_stages')
      .insert({
        document: order.id,
        stage: stage.id
      })
      .select()

    if (response.status == 201 && response.data?.length == 1) {
      order.stage = stage.id

      const map = new Map<number, Order>(mapping.value)
      map.set(order.id, order)
      mapping.value = map

      return order
    } else {
      console.log('error', response)
      throw 'unexpended response status: ' + response.status
    }
  }

  async function resolve(id: number | null) {
    if (id) {
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
    } else {
      return null
    }
  }

  async function searchByNumber(orgId: number, text: string) {
    const response = await supabase
      .from('orders')
      .select()
      .eq('organization', orgId)
      .eq('number', text)
      .order('created_at', { ascending: false })
      .limit(1)

    if (response.status == 200) {
      return response.data?.map((json) => json as Order)
    }

    return []
  }

  async function searchByReferences(orgId: number, text: string) {
    const response = await supabase
      .from('orders')
      .select('refs')
      .eq('organization', orgId)
      .ilike('refs', '%' + text + '%')
      .order('created_at', { ascending: false })
      .limit(10)

    if (response.status == 200) {
      const list = response.data?.map((json) => json.refs)
      return Array.from(new Set(list || []))
    }

    return []
  }

  async function searchByPL(orgId: number, text: string) {
    const response = await supabase
      .from('orders')
      .select('posted_loads')
      .eq('organization', orgId)
      .ilike('posted_loads', '%' + text + '%')
      .order('created_at', { ascending: false })
      .limit(10)

    if (response.status == 200) {
      const list = response.data?.map((json) => json.posted_loads)
      return Array.from(new Set(list || []))
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
    searchByNumber,
    searchByReferences,
    searchByPL,
    changes
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useOrdersStore, import.meta.hot))
}
