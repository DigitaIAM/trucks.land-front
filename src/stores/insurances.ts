import { acceptHMRUpdate, defineStore } from 'pinia'

export interface Insurance extends InsuranceCreate {
  id: number
  created_at: string
  created_by: number
}

export interface InsuranceCreate {
  policy_number: string
  start_date: Date
  end_date: Date
}

export interface InsuranceUpdate {
  policy_number?: string
  start_date?: Date
  end_date?: Date
}

export const useInsuranceStore = defineStore('insurances', () => {
  const listing = ref<Array<Insurance>>([])

  async function loading() {
    const response = await supabase
      .from('insurances')
      .select()
      .order('created_at', { ascending: false })
      .limit(50)

    if (response.status == 200) {
      const list: Array<Insurance> = []

      response.data?.forEach((json) => {
        const insurance = json as Insurance
        list.push(insurance)
      })
      
      listing.value = list
    } else {
      throw 'unexpended response status: ' + response.status
    }
  }

  function create(insurance: InsuranceCreate) {
    supabase
      .from('insurances')
      .insert(insurance)
      .select()
      .then((response) => {
        if (response.status == 201) {
          response.data?.forEach((json) => {
            const insurance = json as Insurance
            listing.value.push(insurance)
          })
        }
        console.log('response', response)
      })
  }

  function update(id: number, insurance: InsuranceUpdate) {
    supabase
      .from('insurances')
      .update(insurance)
      .eq('id', id)
      .select()
      .then((response) => {
        if (response.status == 200) {
          const list = listing.value
          response.data?.forEach((json) => {
            const insurance = json as Insurance
            const index = list.findIndex((v) => v.id == insurance.id)
            if (index < 0) {
              list.push(insurance)
            } else {
              list[index] = insurance
            }
          })
          listing.value = list
        }
      })
  }

  return { listing, loading, create, update }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useInsuranceStore, import.meta.hot))
}
