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
  details?: object
  document?: number
}

export const useEventsStore = defineStore('event', () => {
  async function listing(orderId: number) {
    if (orderId) {
      const response = await supabase
        .from('order_events')
        .select()
        .eq('document', orderId)
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

  function update(id: number, event: EventUpdate) {
    supabase
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

  return { listing, create, update }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useEventsStore, import.meta.hot))
}
