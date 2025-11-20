import { acceptHMRUpdate, defineStore } from 'pinia'
import { useInitializeStore } from '@/composables/use-initialize-store.ts'
import { sleep } from '@/utils/datetime.ts'

export interface Vehicle extends VehicleCreate {
  id: number
  created_at: string
  created_by: number
  name: string
}

export interface VehicleCreate {
  owner: number
  is_active: boolean
  unit_id: string
  vin: string
  model: string
  type: string
  color: string
  year: number
  load_capacity: number
  length: number
  width: number
  height: number
  door_width: number
  door_height: number
  kind: string
  leasing_agreement: boolean
}

export interface VehicleUpdate {
  owner?: number
  is_active?: boolean
  unit_id?: string
  vin?: string
  model?: string
  type?: string
  color?: string
  year?: number
  load_capacity?: number
  length?: number
  width?: number
  height?: number
  door_width?: number
  door_height?: number
  kind?: string
  leasing_agreement?: boolean
}

function convert(vehicle: Vehicle): Vehicle {
  vehicle.name = vehicle.unit_id
  return vehicle
}

export const useVehiclesStore = defineStore('vehicle', () => {
  const mapping = ref(new Map<number, Vehicle | Promise<Vehicle>>())

  const searchResult = ref<Array<Vehicle> | null>(null)

  const { initialized, loading } = useInitializeStore(async () => {
    const response = await supabase.from('vehicles').select()

    const map = new Map<number, Vehicle>()
    response.data?.forEach((json) => {
      const vehicle = convert(json as Vehicle)
      map.set(vehicle.id, vehicle)
    })

    mapping.value = map
  })

  const listing = computedAsync(async () => {
    if (searchResult.value == null) {
      const list = [] as Vehicle[]

      for (const obj of mapping.value.values()) {
        list.push(await obj)
      }

      return list
    } else {
      return searchResult.value
    }
  })

  function create(vehicle: VehicleCreate) {
    supabase
      .from('vehicles')
      .insert(vehicle)
      .select()
      .then((response) => {
        // console.log('response', response)
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

  async function _fetching(id: number): Promise<Vehicle> {
    const response = await supabase.from('vehicles').select().eq('id', id)

    if (response.data && response.data.length > 0) {
      return response.data[0] as Vehicle
    }
    return { id: id, name: 'error loading' } as Vehicle
  }

  async function resolve(id: number | null): Promise<Vehicle | null> {
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
      .from('vehicles')
      .select()
      .ilike('unit_id', '%' + text + '%')
      .limit(10)

    if (response.status == 200) {
      return response.data?.map((json) => convert(json as Vehicle)) ?? []
    }

    return []
  }

  async function searchAndListing(text: string | null) {
    if (text) {
      searchResult.value = await search(text)
    } else {
      searchResult.value = null
    }
  }

  return { initialized, loading, listing, create, update, resolve, search, searchAndListing }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useVehiclesStore, import.meta.hot))
}
