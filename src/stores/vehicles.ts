import { acceptHMRUpdate, defineStore } from 'pinia'
import { useInitializeStore } from '@/composables/use-initialize-store.ts'

export interface Vehicle extends VehicleCreate {
  id: number
  created_at: string
}

export interface VehicleCreate {
  is_cargo_van: boolean
  is_small_straight: boolean
  is_large_straight: boolean
  is_active: boolean

  owner: string
  unit_id: string
  vin: string
  expiry_date: Date
  model: string
  type: string
  color: string
  year: string

  load_capacity: number
  length: number
  width: number
  height: number
  door_width: number
  door_height: number
}

export interface VehicleUpdate {
  is_cargo_van?: boolean
  is_small_straight?: boolean
  is_large_straight?: boolean
  is_active?: boolean

  owner?: string
  unit_id?: string
  vin?: string
  expiry_date?: Date
  model?: string
  type?: string
  color?: string
  year?: string

  load_capacity?: number
  length?: number
  width?: number
  height?: number
  door_width?: number
  door_height?: number
}

export const useVehiclesStore = defineStore('vehicle', () => {
  const mapping = ref(new Map<number, Vehicle>())

  const { initialized, loading } = useInitializeStore(async () => {
    const response = await supabase.from('vehicle').select()

    const map = new Map<number, Vehicle>()
    response.data?.forEach((json) => {
      const vehicle = json as Vehicle
      map.set(vehicle.id, vehicle)
    })

    mapping.value = map
  })

  const listing = computed(() => {
    const list = [] as Vehicle[]

    mapping.value.forEach((v) => {
      list.push(v)
    })

    return list
  })

  function create(vehicle: VehicleCreate) {
    supabase
      .from('vehicle')
      .insert(vehicle)
      .select()
      .then((response) => {
        if (response.status == 201) {
          response.data?.forEach((json) => {
            const vehicle = json as Vehicle
            mapping.value.set(vehicle.id, vehicle)
          })
        }
      })
  }

  function update(id: number, vehicle: VehicleUpdate) {
    supabase
      .from('vehicle')
      .update(vehicle)
      .eq('id', id)
      .select()
      .then((response) => {
        if (response.status == 200) {
          response.data?.forEach((json) => {
            const vehicle = json as Vehicle
            mapping.value.set(vehicle.id, vehicle)
          })
        }
      })
  }

  return { initialized, loading, listing, create, update }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useVehiclesStore, import.meta.hot))
}
