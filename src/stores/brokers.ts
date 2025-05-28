import { acceptHMRUpdate, defineStore } from 'pinia'
import { useInitializeStore } from '@/composables/use-initialize-store.ts'

export interface Broker extends BrokerCreate {
  id: number
  created_at: string
}

export interface BrokerCreate {
  name: string
  contact: string
  phone: string
  email: string
  city: string
  street: string
  state: string
  zip: string
  ms: string
  dot: string
}

export interface BrokerUpdate {
  name?: string
  contact?: string
  phone?: string
  email?: string
  city?: string
  street?: string
  state?: string
  zip?: string
  ms?: string
  dot?: string
}

export const useBrokersStore = defineStore('broker', () => {
  const mapping = ref(new Map<number, Broker>())

  const { initialized, loading } = useInitializeStore(async () => {
    const response = await supabase.from('brokers').select()

    const map = new Map<number, Broker>()
    response.data?.forEach((json) => {
      const broker = json as Broker
      map.set(broker.id, broker)
    })

    mapping.value = map
  })

  const listing = computed(() => {
    const list = [] as Broker[]

    mapping.value.forEach((v) => {
      list.push(v)
    })

    return list
  })

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

  return { initialized, loading, listing, create, update }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useBrokersStore, import.meta.hot))
}
