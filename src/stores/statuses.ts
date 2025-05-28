import { acceptHMRUpdate, defineStore } from 'pinia'
import { useInitializeStore } from '@/composables/use-initialize-store.ts'

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

  function resolve(id: number) {
    return mapping.value.get(id)
  }

  return { listing, initialized, loading, create, update, resolve }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useStatusesStore, import.meta.hot))
}
