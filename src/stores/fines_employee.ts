import { acceptHMRUpdate, defineStore } from 'pinia'

export interface FinesEmployee extends FinesEmployeeCreate {
  id: number
  created_at: string
  organization: number
}

export interface FinesEmployeeCreate {
  organization: number
  employee: number
  description: string
  amount: number
  created_by: number
}

export interface FinesEmployeeUpdate {
  employee?: number
  description?: string
  amount?: number
}

export const useFinesEmployeeStore = defineStore('employee_fines', () => {
  const listing = ref<Array<FinesEmployee>>([])

  async function loading(orgId: number | null) {
    if (orgId) {
      const response = await supabase
        .from('employee_fines')
        .select()
        .eq('organization', orgId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (response.status == 200) {
        const list: Array<FinesEmployee> = []

        response.data?.forEach((json) => {
          const fine = json as FinesEmployee
          list.push(fine)
        })

        listing.value = list
      } else {
        throw 'unexpended response status: ' + response.status
      }
    } else {
      listing.value = [] as Array<FinesEmployee>
    }
  }

  function create(fine: FinesEmployeeCreate) {
    supabase
      .from('employee_fines')
      .insert(fine)
      .select()
      .then((response) => {
        if (response.status == 201) {
          response.data?.forEach((json) => {
            const fine = json as FinesEmployee
            listing.value.push(fine)
          })
        }
      })
    console.log('create', fine)
  }

  function update(id: number, fine: FinesEmployeeUpdate) {
    supabase
      .from('employee_fines')
      .update(fine)
      .eq('id', id)
      .select()
      .then((response) => {
        if (response.status == 200) {
          const list = listing.value
          response.data?.forEach((json) => {
            const fine = json as FinesEmployee
            const index = list.findIndex((v) => v.id == fine.id)
            if (index < 0) {
              list.push(fine)
            } else {
              list[index] = fine
            }
          })

          listing.value = list
        }
      })
  }

  return { listing, loading, create, update }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useFinesEmployeeStore, import.meta.hot))
}
