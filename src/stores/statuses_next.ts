import { acceptHMRUpdate, defineStore } from 'pinia'
import { useInitializeStore } from '@/composables/use-initialize-store.ts'
import type { Status } from '@/stores/statuses.ts'

export interface StatusNext {
  id: number
  createAt: string
  status: number
  next: number
}

export const useStatusesNextStore = defineStore('statusNext', () => {
  const mapping = ref(new Map<number, Map<number, StatusNext>>())

  const { initialized, loading } = useInitializeStore(async () => {
    const response = await supabase.from('statuses_next').select()

    const map = new Map<number, Map<number, StatusNext>>()
    response.data?.forEach((json) => {
      const link = json as StatusNext

      const m = map.get(link.status) ?? new Map<number, StatusNext>()

      m.set(link.next, link)

      map.set(link.status, m)
    })

    mapping.value = map
  })

  const listing = computed(() => {
    const list = [] as StatusNext[]

    mapping.value.forEach((v) => {
      list.push(v)
    })

    return list
  })

  function nextFor(status: Status) {
    const l = Array.from(mapping.value.get(status.id)?.keys() ?? [])

    return l
  }

  async function update(status: Status, next: []) {
    const map = mapping.value.get(status.id) ?? new Map<number, StatusNext>()

    // insert
    for (const i in next) {
      const id = next[i]

      if (map.get(id) == null) {
        const response = await supabase
          .from('statuses_next')
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
        const response = await supabase.from('statuses_next').delete().eq('id', link.id).select()

        if (response.status == 200) {
          map.delete(link.next)
        }
      }
    }

    mapping.value.set(status.id, map)
  }

  return { listing, initialized, loading, update, nextFor }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useStatusesNextStore, import.meta.hot))
}
