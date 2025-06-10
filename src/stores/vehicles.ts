import { acceptHMRUpdate, defineStore } from 'pinia'
import { useInitializeStore } from '@/composables/use-initialize-store.ts'

export interface Vehicle extends VehicleCreate {
  id: number
  created_at: string

  name: string
}

export interface VehicleCreate {
  is_active: boolean

  owner: number
  unit_id: string
  vin: string
  expiry_date: Date

  model: string
  type: string
  kind: string

  color: string
  year: number

  load_capacity: number
  length: number
  width: number
  height: number
  door_width: number
  door_height: number
}

export interface VehicleUpdate {
  is_active?: boolean

  owner?: number
  unit_id?: string
  vin?: string
  expiry_date?: Date

  model?: string
  type?: string
  kind?: string

  color?: string
  year?: number

  load_capacity?: number
  length?: number
  width?: number
  height?: number
  door_width?: number
  door_height?: number
}

function convert(vehicle: Vehicle): Vehicle {
  vehicle.name = vehicle.unit_id
  return vehicle
}

export const useVehiclesStore = defineStore('vehicle', () => {
  const mapping = ref(new Map<number, Vehicle>())

  const { initialized, loading } = useInitializeStore(async () => {
    const response = await supabase.from('vehicles').select()

    const map = new Map<number, Vehicle>()
    response.data?.forEach((json) => {
      const vehicle = convert(json as Vehicle)
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
      .from('vehicles')
      .insert(vehicle)
      .select()
      .then((response) => {
        console.log('response', response)
        if (response.status == 201) {
          response.data?.forEach((json) => {
            const vehicle = convert(json as Vehicle)
            mapping.value.set(vehicle.id, vehicle)
          })
        }
      })
  }

  function update(id: number, vehicle: VehicleUpdate) {
    supabase
      .from('vehicles')
      .update(vehicle)
      .eq('id', id)
      .select()
      .then((response) => {
        if (response.status == 200) {
          response.data?.forEach((json) => {
            const vehicle = convert(json as Vehicle)
            mapping.value.set(vehicle.id, vehicle)
          })
        }
      })
  }

  async function resolve(id: number) {
    // console.log('vehicle resolve', id)
    if (!(id && id >= 0)) {
      // console.log('id is not number')
      return null
    }

    const v = mapping.value.get(id)
    if (v) {
      return v
    }

    const response = await supabase.from('vehicles').select().eq('id', id)

    const map = new Map<number, Vehicle>()
    response.data?.forEach((json) => {
      const vehicle = convert(json as Vehicle)
      map.set(vehicle.id, vehicle)
      mapping.value.set(vehicle.id, vehicle)
    })

    return map.get(id)
  }

  async function search(text: string) {
    console.log('driver search', text)

    const response = await supabase
      .from('vehicles')
      .select()
      .ilike('unit_id', '%' + text + '%')
      .limit(10)

    console.log('response', response)

    if (response.status == 200) {
      return response.data?.map((json) => convert(json as Vehicle))
    }

    return []
  }

  return { initialized, loading, listing, create, update, resolve, search }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useVehiclesStore, import.meta.hot))
}
