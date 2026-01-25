import { acceptHMRUpdate, defineStore } from 'pinia'

export interface OwnerVehicle extends OwnerVehicleCreate {
  id: number
  created_at: string
  created_by: number
}

export interface OwnerVehicleCreate {
  owner: number
  vehicle: number
  insurance: number
}

export interface OwnerVehicleUpdate {
  owner?: number
  vehicle?: number
  insurance?: number
}

export const useOwnerVehicleStore = defineStore('owner_vehicle', () => {
  const listing = ref<Array<OwnerVehicle>>([])

  async function loading() {
    const response = await supabase
      .from('owner_vehicle')
      .select()
      .order('created_at', { ascending: false })
      .limit(50)

    if (response.status == 200) {
      const list: Array<OwnerVehicle> = []

      response.data?.forEach((json) => {
        const record = json as OwnerVehicle
        list.push(record)
      })

      listing.value = list
    } else {
      throw 'unexpended response status: ' + response.status
    }
  }

  function create(record: OwnerVehicleCreate) {
    supabase
      .from('owner_vehicle')
      .insert(record)
      .select()
      .then((response) => {
        if (response.status == 201) {
          response.data?.forEach((json) => {
            const record = json as OwnerVehicle
            listing.value.push(record)
          })
        }
      })
  }

  function update(id: number, record: OwnerVehicleUpdate) {
    supabase
      .from('owner_vehicle')
      .update(record)
      .eq('id', id)
      .select()
      .then((response) => {
        if (response.status == 200) {
          const list = listing.value
          response.data?.forEach((json) => {
            const record = json as OwnerVehicle
            const index = list.findIndex((v) => v.id == record.id)
            if (index < 0) {
              list.push(record)
            } else {
              list[index] = record
            }
          })
          listing.value = list
        }
      })
  }

  return { listing, loading, create, update }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useOwnerVehicleStore, import.meta.hot))
}
