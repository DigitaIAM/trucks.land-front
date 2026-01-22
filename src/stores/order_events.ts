import { acceptHMRUpdate, defineStore } from 'pinia'

export interface OrderEvent extends EventCreate {
  id: number
  created_at: string
  created_by: number
}

export interface EventCreate {
  document: number
  kind: string
  datetime: Date
  company_at_location: string
  address: string
  city: string
  state: string
  zip: string
  cost: number
  driver: number
  company: number
  vehicle: number
  vehicle_found_by: number
  percent_vf: number
  details: object
  percent: number
}

export interface EventUpdate {
  document?: number
  kind?: string
  datetime?: Date
  company_at_location?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  cost?: number
  driver?: number
  company?: number
  vehicle?: number
  vehicle_found_by?: number
  percent_vf?: number
  owner?: number
  details?: object
  percent?: number
}

export const useEventsStore = defineStore('event', () => {
  const orderId = ref<number | null>(null)
  const mapping = ref(new Map<number, OrderEvent[]>())

  function setOrderId(id: number) {
    orderId.value = id
  }

  const listing = computedAsync(async () => {
    const id = orderId.value
    if (id) {
      const v = mapping.value.get(id)
      if (v) return v

      const promise = await fetching(id)
      mapping.value.set(id, promise)

      return promise
    } else {
      return []
    }
  }, [])

  async function fetching(id: number): Promise<Array<OrderEvent>> {
    if (id) {
      const response = await supabase
        .from('order_events')
        .select()
        .eq('document', id)
        .order('datetime', { ascending: true })
      // .order('datetime') // .throwOnError()
      // console.log(response)

      if (response.status == 200) {
        const list: Array<OrderEvent> = []

        response.data?.forEach((json) => {
          const event = json as OrderEvent
          list.push(event)
        })

        return list
      } else {
        throw 'unexpended response status: ' + response.status
      }
    } else {
      return []
    }
  }

  async function pickUp(orderId: number): Promise<Array<OrderEvent>> {
    if (orderId) {
      const response = await supabase
        .from('order_events')
        .select()
        .eq('document', orderId)
        .eq('kind', 'pick-up')
        .order('datetime', { ascending: false })
      // .order('datetime') // .throwOnError()
      // console.log(response)

      if (response.status == 200) {
        const list: Array<OrderEvent> = []

        response.data?.forEach((json) => {
          const event = json as OrderEvent
          list.push(event)
        })

        // console.log('list', list)

        return list
      } else {
        throw 'unexpended response status: ' + response.status
      }
    } else {
      return []
    }
  }

  async function delivery(orderId: number): Promise<Array<OrderEvent>> {
    if (orderId) {
      const response = await supabase
        .from('order_events')
        .select()
        .eq('document', orderId)
        .eq('kind', 'delivery')
        .order('datetime', { ascending: false })
      // .order('datetime') // .throwOnError()
      // console.log(response)

      if (response.status == 200) {
        const list: Array<OrderEvent> = []

        response.data?.forEach((json) => {
          const event = json as OrderEvent
          list.push(event)
        })

        return list
      } else {
        throw 'unexpended response status: ' + response.status
      }
    } else {
      return []
    }
  }

  async function create(event: EventCreate) {
    console.log('create', event)
    const response = await supabase.from('order_events').insert(event).select() // .throwOnError()
    console.log(response)

    if (response.status == 201) {
      response.data?.forEach((json) => {
        const event = json as OrderEvent

        const map = mapping.value

        const list = map.get(event.document) ?? []
        list.push(event)

        list.sort((a, b) => {
          if (a.datetime == b.datetime) {
            return 0
          } else if (a.datetime > b.datetime) {
            return -1
          } else {
            return 1
          }
        })

        map.set(event.document, list)
        mapping.value = map
      })
    } else {
      throw 'unexpended response status: ' + response.status
    }
  }

  async function update(id: number, event: EventUpdate) {
    await supabase
      .from('order_events')
      .update(event)
      .eq('id', id)
      .select()
      .then((response) => {
        if (response.status == 200) {
          response.data?.forEach((json) => {
            const event = json as OrderEvent

            const map = mapping.value

            const list = map.get(event.document) ?? []

            let index = -1
            for (const [i, value] of list.entries()) {
              if (value.id == event.id) {
                index = i
                break
              }
            }

            if (index == -1) {
              list.push(event)

              list.sort((a, b) => {
                if (a.datetime == b.datetime) {
                  return 0
                } else if (a.datetime > b.datetime) {
                  return -1
                } else {
                  return 1
                }
              })
            } else {
              list[index] = event
            }

            map.set(event.document, list)

            mapping.value = map
          })
        }
      })
  }

  function onUpdate(id: number, changes: OrderEvent) {
    const event = mapping.value.get(id)
    if (event) {
      const map = new Map<number, OrderEvent[]>(mapping.value)

      const copyEvent = Object.assign(event, changes)

      map.set(copyEvent.id, copyEvent)

      mapping.value = map
    }
  }

  return { setOrderId, listing, create, update, fetching, pickUp, delivery, onUpdate }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useEventsStore, import.meta.hot))
}
