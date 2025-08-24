import { acceptHMRUpdate, defineStore } from 'pinia'

export interface Event extends EventCreate {
  id: number
  created_at: string
}

export interface EventCreate {
  kind: string
  datetime: Date
  address: string
  city: string
  state: string
  zip: string
  cost: number
  driver: number
  vehicle: number
  owner: number
  details: object
  document: number
}

export interface EventUpdate {
  kind?: string
  datetime?: Date
  address?: string
  city?: string
  state?: string
  zip?: string
  cost?: number
  driver?: number
  vehicle?: number
  owner?: number
  details?: object
  document?: number
}

export const useEventsStore = defineStore('event', () => {
  const mapping = ref(new Map<number, Event[] | Promise<Event[]>>())

  async function fetching(id: number): Promise<Array<Event>> {
    const response = await supabase
      .from('order_events')
      .select()
      .eq('document', id)
      .order('datetime', { ascending: false })
    // .order('datetime') // .throwOnError()
    // console.log(response)

    if (response.status == 200) {
      const list: Array<Event> = []

      response.data?.forEach((json) => {
        const event = json as Event
        list.push(event)
      })

      return list
    } else {
      throw 'unexpended response status: ' + response.status
    }
  }

  async function listing(id: number) {
    if (id) {
      const v = mapping.value.get(id)
      if (v) return v

      const promise = fetching(id)
      mapping.value.set(id, promise)

      return promise
    } else {
      return []
    }
  }

  async function pickUp(orderId: number) {
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
        const list = []

        response.data?.forEach((json) => {
          const event = json as Event
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

  async function delivery(orderId: number) {
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
        const list = []

        response.data?.forEach((json) => {
          const event = json as Event
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
    // console.log('create', event)
    const response = await supabase.from('order_events').insert(event).select() // .throwOnError()
    // console.log(response)

    if (response.status == 201) {
      response.data?.forEach((json) => {
        // const event = json as Event
        // mapping.value.set(event.id, event)
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
            // const event = json as Event
            // mapping.value.set(event.id, event)
          })
        }
      })
  }

  return { listing, create, update, fetching, pickUp, delivery }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useEventsStore, import.meta.hot))
}
