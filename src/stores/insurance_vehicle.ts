import { acceptHMRUpdate, defineStore } from 'pinia'

export interface InsuranceVehicle extends InsuranceVehicleCreate {
  id: number
  created_at: string
  created_by: number
}

export interface InsuranceVehicleCreate {
  vehicle: number
  insurance: number
}

export interface InsuranceVehicleUpdate {
  vehicle?: number
  insurance?: number
}

export const useInsuranceVehicleStore = defineStore('insurance_vehicle', () => {
  const listing = ref<Array<InsuranceVehicle>>([])

  async function loading(id: number) {
    const response = await supabase.from('insurance_vehicle').select().eq('insurance', id)
    // .order('created_at', { ascending: false })

    if (response.status == 200) {
      const list: Array<InsuranceVehicle> = []

      response.data?.forEach((json) => {
        const record = json as InsuranceVehicle
        list.push(record)
      })

      listing.value = list
    } else {
      throw 'unexpended response status: ' + response.status
    }
  }

  function create(record: InsuranceVehicleCreate) {
    supabase
      .from('insurance_vehicle')
      .insert(record)
      .select()
      .then((response) => {
        if (response.status == 201) {
          response.data?.forEach((json) => {
            const record = json as InsuranceVehicle
            listing.value.push(record)
          })
        }
        console.log('response', listing)
      })
  }

  function update(id: number, record: InsuranceVehicleUpdate) {
    supabase
      .from('insurance_vehicle')
      .update(record)
      .eq('id', id)
      .select()
      .then((response) => {
        if (response.status == 200) {
          const list = listing.value
          response.data?.forEach((json) => {
            const record = json as InsuranceVehicle
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
  import.meta.hot.accept(acceptHMRUpdate(useInsuranceVehicleStore, import.meta.hot))
}
