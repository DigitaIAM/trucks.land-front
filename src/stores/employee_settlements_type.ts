import { acceptHMRUpdate, defineStore } from 'pinia'
import { useInitializeStore } from '@/composables/use-initialize-store.ts'
import { sleep } from '@/utils/datetime.ts'
import type { Status } from '@/stores/stages.ts'

export interface EmployeeSettlementsType extends EmployeeSettlementsTypeCreate {
  id: number
  create_at: string
  created_by: number
}

export interface EmployeeSettlementsTypeCreate {
  settlement_type: string
  color: string
  currency: string
}

export interface EmployeeSettlementsTypeUpdate {
  settlement_type?: string
  color?: string
  currency?: string
}

export const useEmployeeSettlementsTypeStore = defineStore('employee_settlements_type', () => {
  const mapping = ref(new Map<number, EmployeeSettlementsType | Promise<EmployeeSettlementsType>>())

  const { initialized, loading } = useInitializeStore(async () => {
    const response = await supabase.from('employee_settlements_type').select()

    const map = new Map<number, EmployeeSettlementsType>()
    response.data?.forEach((json) => {
      const type = json as EmployeeSettlementsType
      map.set(type.id, type)
    })

    mapping.value = map
  })

  const listing = computedAsync(async () => {
    const list = [] as EmployeeSettlementsType[]

    for (const obj of mapping.value.values()) {
      list.push(await obj)
    }

    return list
  })

  async function fetchListing() {
    this.loading = true
    try {
      const { data, error } = await supabase.from('employee_settlements_type').select('*')

      if (error) throw error

      this.listing = data
    } catch (error) {
      console.error('Ошибка Supabase при загрузке типов:', error.message)
    } finally {
      this.loading = false
    }
  }

  async function _fetching(id: number): Promise<EmployeeSettlementsType> {
    const response = await supabase.from('employee_settlements_type').select().eq('id', id)

    if (response.data && response.data.length > 0) {
      return response.data[0] as EmployeeSettlementsType
    }
    return { id: id, settlement_type: 'error loading' } as EmployeeSettlementsType
  }

  async function resolve(id: number | null): Promise<EmployeeSettlementsType | null> {
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

  return { listing, initialized, loading, fetchListing, resolve }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useEmployeeSettlementsTypeStore, import.meta.hot))
}
