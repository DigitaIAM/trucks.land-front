import { acceptHMRUpdate, defineStore } from 'pinia'
import { useInitializeStore } from '@/composables/use-initialize-store.ts'
import { sleep } from '@/utils/datetime.ts'

export interface VehicleType extends VehicleTypeCreate {
  id: number
  create_at: string
  created_by: number
}

export interface VehicleTypeCreate {
  name: string
}

export const useVehicleTypeStore = defineStore('vehicle_type', () => {
  const mapping = ref(new Map<number, VehicleType | Promise<VehicleType>>())

  const { initialized, loading } = useInitializeStore(async () => {
    const response = await supabase.from('vehicle_type').select()

    const map = new Map<number, VehicleType>()
    response.data?.forEach((json) => {
      const type = json as VehicleType
      map.set(type.id, type)
    })

    mapping.value = map
  })

  const listing = computedAsync(async () => {
    const list = [] as VehicleType[]

    for (const obj of mapping.value.values()) {
      list.push(await obj)
    }

    return list
  })

  async function fetchListing() {
    this.loading = true
    try {
      const { data, error } = await supabase.from('vehicle_type').select('*')

      if (error) throw error

      this.listing = data
    } catch (error) {
      console.error('Ошибка Supabase при загрузке типов:', error.message)
    } finally {
      this.loading = false
    }
  }

  async function _fetching(id: number): Promise<VehicleType> {
    const response = await supabase.from('vehicle_type').select().eq('id', id)

    if (response.data && response.data.length > 0) {
      return response.data[0] as VehicleType
    }
    return { id: id, name: 'error loading' } as VehicleType
  }

  async function resolve(id: number | null): Promise<VehicleType | null> {
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
  import.meta.hot.accept(acceptHMRUpdate(useVehicleTypeStore, import.meta.hot))
}
