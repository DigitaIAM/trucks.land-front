import { acceptHMRUpdate, defineStore } from 'pinia'

export interface EmployeeHiring extends EmployeeHiringCreate {
  id: number
  created_at: string
  performed_by: number
  organization: number
  user_id: number
  action: string
  date_action: Date
  details: string
}

export interface EmployeeHiringCreate {
  organization: number
  user_id: number
  action: string
  date_action: Date
  details: string
}

export interface EmployeeHiringUpdate {
  user_id?: number
  action?: string
  date_action?: Date
  details?: string
}

export const useEmployeeHiringStore = defineStore('employee_hiring_history', () => {
  const listing = ref<Array<EmployeeHiring>>([])

  async function loading(orgId: number | null) {
    if (orgId) {
      const response = await supabase
        .from('employee_hiring_history')
        .select()
        .eq('organization', orgId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (response.status == 200) {
        const list: Array<EmployeeHiring> = []

        response.data?.forEach((json) => {
          const record = json as EmployeeHiring
          list.push(record)
        })

        listing.value = list
      } else {
        throw 'unexpended response status: ' + response.status
      }
    } else {
      listing.value = [] as Array<EmployeeHiring>
    }
  }

  function create(record: EmployeeHiringCreate) {
    supabase
      .from('employee_hiring_history')
      .insert(record)
      .select()
      .then((response) => {
        if (response.status == 201) {
          response.data?.forEach((json) => {
            const record = json as EmployeeHiring
            listing.value.push(record)
          })
        }
      })
  }

  function update(id: number, record: EmployeeHiringUpdate) {
    supabase
      .from('employee_hiring_history')
      .update(record)
      .eq('id', id)
      .select()
      .then((response) => {
        if (response.status == 200) {
          const list = listing.value
          response.data?.forEach((json) => {
            const record = json as EmployeeHiring
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
  import.meta.hot.accept(acceptHMRUpdate(useEmployeeHiringStore, import.meta.hot))
}
