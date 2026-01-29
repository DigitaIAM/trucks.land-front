import { acceptHMRUpdate, defineStore } from 'pinia'

export interface InsuranceDriver extends InsuranceDriverCreate {
  id: number
  created_at: string
  created_by: number
}

export interface InsuranceDriverCreate {
  insurance: number
  driver: number
}

export interface InsuranceDriverUpdate {
  insurance?: number
  driver?: number
}

export const useInsuranceDriverStore = defineStore('insurance_driver', () => {
  const listing = ref<Array<InsuranceDriver>>([])

  async function loading(id: number) {
    const response = await supabase.from('insurance_driver').select().eq('insurance', id)

    if (response.status == 200) {
      const list: Array<InsuranceDriver> = []

      response.data?.forEach((json) => {
        const record = json as InsuranceDriver
        list.push(record)
      })
      listing.value = list
    } else {
      throw 'unexpended response status: ' + response.status
    }
  }

  function create(record: InsuranceDriverCreate) {
    supabase
      .from('insurance_driver')
      .insert(record)
      .select()
      .then((response) => {
        if (response.status == 201) {
          response.data?.forEach((json) => {
            const record = json as InsuranceDriver
            listing.value.push(record)
          })
        }
      })
  }

  function update(id: number, record: InsuranceDriverUpdate) {
    supabase
      .from('insurance_driver')
      .update(record)
      .eq('id', id)
      .select()
      .then((response) => {
        if (response.status == 200) {
          const list = listing.value
          response.data?.forEach((json) => {
            const record = json as InsuranceDriver
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
  import.meta.hot.accept(acceptHMRUpdate(useInsuranceDriverStore, import.meta.hot))
}
