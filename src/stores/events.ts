import { acceptHMRUpdate, defineStore } from 'pinia'
import { useInitializeStore } from '@/composables/use-initialize-store.ts'

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
  order: number
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
  order?: number
}

export const useEventsStore = defineStore('event', () => {
  const mapping = ref(new Map<number, Event>())

  const { initialized, loading } = useInitializeStore(async () => {
    const response = await supabase.from('events').select()

    const map = new Map<number, Event>()
    response.data?.forEach((json) => {
      const event = json as Event
      map.set(event.id, event)
    })

    mapping.value = map
  })

  const listing = computed(() => {
    const list = [] as Event[]

    mapping.value.forEach((v) => {
      list.push(v)
    })

    return list
  })

  async function create(event: EventCreate) {
    console.log('create', event)
    const response = await supabase.from('events').insert(event).select() // .throwOnError()
    console.log(response)

    if (response.status == 201) {
      response.data?.forEach((json) => {
        const event = json as Event
        mapping.value.set(event.id, event)
      })
    } else {
      throw 'unexpended response status: ' + response.status
    }
  }

  function update(id: number, event: EventUpdate) {
    supabase
      .from('events')
      .update(event)
      .eq('id', id)
      .select()
      .then((response) => {
        if (response.status == 200) {
          response.data?.forEach((json) => {
            const event = json as Event
            mapping.value.set(event.id, event)
          })
        }
      })
  }

  async function resolve(id: number) {
    const v = mapping.value.get(id)
    if (v) {
      return v
    }

    const response = await supabase.from('events').select().eq('id', id)

    const map = new Map<number, Event>()
    response.data?.forEach((json) => {
      const event = json as Event
      map.set(event.id, event)
      mapping.value.set(event.id, event)
    })

    return map.get(id)
  }

  return { initialized, loading, listing, create, update, resolve }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useEventsStore, import.meta.hot))
}
