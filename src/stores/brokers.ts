import { acceptHMRUpdate, defineStore } from 'pinia'
import { useInitializeStore } from '@/composables/use-initialize-store.ts'
import { sleep } from '@/utils/datetime.ts'

export interface Broker extends BrokerCreate {
  id: number
  created_at: string
  created_by: string
}

export interface BrokerCreate {
  is_active: boolean
  name: string
  phone: string
  email: string
  city: string
  street: string
  ms: string
  dot: string
  state: string
  zip: string
  contact: string
}

export interface BrokerUpdate {
  is_active?: boolean
  name?: string
  phone?: string
  email?: string
  city?: string
  street?: string
  ms?: string
  dot?: string
  state?: string
  zip?: string
  contact?: string
}

export const useBrokersStore = defineStore('broker', () => {
  const mapping = ref(new Map<number, Broker | Promise<Broker>>())

  const searchResult = ref<Array<Broker> | null>(null)

  const { initialized, loading } = useInitializeStore(async () => {
    const response = await supabase.from('brokers').select()

    const map = new Map<number, Broker>()
    response.data?.forEach((json) => {
      const broker = json as Broker
      map.set(broker.id, broker)
    })

    mapping.value = map
  })

  const listing = computedAsync(async () => {
    if (searchResult.value == null) {
      const list = [] as Broker[]

      for (const obj of mapping.value.values()) {
        list.push(await obj)
      }

      return list
    } else {
      return searchResult.value
    }
  }, [])

  function create(broker: BrokerCreate) {
    supabase
      .from('brokers')
      .insert(broker)
      .select()
      .then((response) => {
        if (response.status == 201) {
          response.data?.forEach((json) => {
            const broker = json as Broker
            mapping.value.set(broker.id, broker)
          })
        }
      })
  }

  function update(id: number, broker: BrokerUpdate) {
    supabase
      .from('brokers')
      .update(broker)
      .eq('id', id)
      .select()
      .then((response) => {
        if (response.status == 200) {
          response.data?.forEach((json) => {
            const broker = json as Broker
            mapping.value.set(broker.id, broker)
          })
        }
      })
  }

  async function _fetching(id: number): Promise<Broker> {
    const response = await supabase.from('brokers').select().eq('id', id)

    if (response.data && response.data.length > 0) {
      return response.data[0] as Broker
    }
    return { id: id, name: 'error loading' } as Broker
  }

  async function resolve(id: number | null): Promise<Broker | null> {
    if (!id || id < 0) return null

    while (loading.value) {
      await sleep(10)
    }

    const v = mapping.value.get(id)
    if (v) return v

    const promise = _fetching(id)
    mapping.value.set(id, promise)

    return promise
  }

  async function search(text: string): Promise<Array<Broker>> {
    const response = await supabase
      .from('brokers')
      .select()
      .ilike('name', '%' + text + '%')
      .limit(10)

    if (response.status == 200) {
      return response.data?.map((json) => json as Broker) ?? []
    }

    return []
  }

  async function searchAndListing(text: string | null) {
    if (text) {
      searchResult.value = await search(text)
    } else {
      searchResult.value = null
    }
  }

  return { initialized, loading, listing, create, update, resolve, search, searchAndListing }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useBrokersStore, import.meta.hot))
}
