import { acceptHMRUpdate, defineStore } from 'pinia'
import { useInitializeStore } from '@/composables/use-initialize-store.ts'
import type { Organization } from '@/stores/organizations.ts'

export interface Broker extends BrokerCreate {
  id: number
  created_at: string
}

export interface BrokerCreate {
  is_active: boolean
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
  is_active?: boolean
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

  function resolve(id: number) {
    return mapping.value.get(id)
  }

  async function search(text: string) {
    const response = await supabase
      .from('brokers')
      .select()
      .ilike('name', '%' + text + '%')

    if (response.status == 200) {
      return response.data?.map((json) => json as Broker)
    }

    return []
  }

  return { initialized, loading, listing, create, update, resolve, search }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useBrokersStore, import.meta.hot))
}
