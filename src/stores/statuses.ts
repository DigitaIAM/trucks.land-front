import { acceptHMRUpdate, defineStore } from 'pinia'
import { useInitializeStore } from '@/composables/use-initialize-store.ts'
import type { Broker } from '@/stores/brokers.ts'

export interface Status extends StatusCreate {
  id: number
  createAt: string
}

export interface StatusCreate {
  name: string
  color: string
}

export interface StatusUpdate {
  name?: string
  color?: string
}

export const useStatusesStore = defineStore('status', () => {
  const mapping = ref(new Map<number, Status>())

  const { initialized, loading } = useInitializeStore(async () => {
    const response = await supabase.from('statuses').select()

    const map = new Map<number, Status>()
    response.data?.forEach((json) => {
      const status = json as Status
      map.set(status.id, status)
    })

    mapping.value = map
  })

  const listing = computed(() => {
    const list = [] as Status[]

    mapping.value.forEach((v) => {
      list.push(v)
    })

    return list
  })

  function create(status: StatusCreate) {
    supabase
      .from('statuses')
      .insert(status)
      .select()
      .then((response) => {
        if (response.status == 201) {
          response.data?.forEach((json) => {
            const status = json as Status
            mapping.value.set(status.id, status)
          })
        }
      })
  }

  function update(id: number, status: StatusUpdate) {
    supabase
      .from('statuses')
      .update(status)
      .eq('id', id)
      .select()
      .then((response) => {
        if (response.status == 200) {
          response.data?.forEach((json) => {
            const status = json as Status
            mapping.value.set(status.id, status)
          })
        }
      })
  }

  async function resolve(id: number) {
    const v = mapping.value.get(id)
    if (v) {
      return v
    }

    const response = await supabase.from('statuses').select().eq('id', id)

    const map = new Map<number, Status>()
    response.data?.forEach((json) => {
      const status = json as Status
      map.set(status.id, status)
      mapping.value.set(status.id, status)
    })

    return map.get(id)
  }

  async function search(text: string) {
    const response = await supabase
      .from('statuses')
      .select()
      .ilike('name', '%' + text + '%')
      .limit(10)

    if (response.status == 200) {
      return response.data?.map((json) => json as Status)
    }

    return []
  }

  return { listing, initialized, loading, create, update, resolve, search }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useStatusesStore, import.meta.hot))
}
