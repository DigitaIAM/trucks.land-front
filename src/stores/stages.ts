import { acceptHMRUpdate, defineStore } from 'pinia'
import { useInitializeStore } from '@/composables/use-initialize-store.ts'
import { sleep } from '@/utils/datetime.ts'

export interface Status extends StatusCreate {
  id: number
  create_at: string
  created_by: number
}

export interface StatusCreate {
  name: string
  color: string
  is_ready_for_payout: boolean
  is_week_fixation: boolean
}

export interface StatusUpdate {
  name?: string
  color?: string
  is_ready_for_payout?: boolean
  is_week_fixation?: boolean
}

export const useStatusesStore = defineStore('stage', () => {
  const mapping = ref(new Map<number, Status | Promise<Status>>())

  const { initialized, loading } = useInitializeStore(async () => {
    const response = await supabase.from('stages').select()

    const map = new Map<number, Status>()
    response.data?.forEach((json) => {
      const status = json as Status
      map.set(status.id, status)
    })

    mapping.value = map
  })

  const listing = computedAsync(async () => {
    const list = [] as Status[]

    for (const obj of mapping.value.values()) {
      list.push(await obj)
    }

    return list
  })

  function create(status: StatusCreate) {
    supabase
      .from('stages')
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
      .from('stages')
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

  async function _fetching(id: number): Promise<Status> {
    const response = await supabase.from('stages').select().eq('id', id)

    if (response.data && response.data.length > 0) {
      return response.data[0] as Status
    }
    return { id: id, name: 'error loading' } as Status
  }

  async function resolve(id: number | null): Promise<Status | null> {
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

  async function search(text: string) {
    const response = await supabase
      .from('stages')
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
