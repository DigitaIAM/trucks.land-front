import { acceptHMRUpdate, defineStore } from 'pinia'
import { useInitializeStore } from '@/composables/use-initialize-store.ts'
import type { Status } from '@/stores/stages.ts'

export interface StatusNext {
  id: number
  create_at: string
  created_by: number
  stage?: number
  next: number
}

export const useStatusesNextStore = defineStore('stage_transitions', () => {
  const mapping = ref(new Map<number, Map<number, StatusNext>>())

  const { initialized, loading } = useInitializeStore(async () => {
    const response = await supabase.from('stage_transitions').select()

    const map = new Map<number, Map<number, StatusNext>>()
    response.data?.forEach((json) => {
      const link = json as StatusNext

      const m = map.get(link.stage ?? -1) ?? new Map<number, StatusNext>()

      m.set(link.next, link)

      map.set(link.stage ?? -1, m)
    })

    mapping.value = map
  })

  function nextFor(status?: number) {
    if (status) {
      return Array.from(mapping.value.get(status)?.keys() ?? [])
    } else {
      return Array.from(mapping.value.get(-1)?.keys() ?? [])
    }
  }

  async function update(status: Status, next: number[]) {
    const map = mapping.value.get(status.id) ?? new Map<number, StatusNext>()

    // insert
    for (const i in next) {
      const id = next[i]

      if (map.get(id) == null) {
        const response = await supabase
          .from('stage_transitions')
          .insert({ status: status.id, next: id })
          .select()

        if (response.status == 201) {
          response.data?.forEach((json) => {
            const link = json as StatusNext
            map.set(link.next, link)
          })
        }
      }
    }

    // delete
    const values = Array.from(map.values())
    for (const i in values) {
      const link = values[i]

      if (next.indexOf(link.next) < 0) {
        const response = await supabase
          .from('stage_transitions')
          .delete()
          .eq('id', link.id)
          .select()

        if (response.status == 200) {
          map.delete(link.next)
        }
      }
    }

    mapping.value.set(status.id, map)
  }

  return { initialized, loading, update, nextFor }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useStatusesNextStore, import.meta.hot))
}
