import { acceptHMRUpdate, defineStore } from 'pinia'

export interface SettlementEmployee extends SettlementEmployeeCreate {
  id: number
  created_at: string
  created_by: number
  organization: number
}

export interface SettlementEmployeeCreate {
  employee: number
  notes: string
  amount: number
}

export interface SettlementEmployeeUpdate {
  employee?: number
  notes?: string
  amount?: number
}

export const useSettlementsEmployeeStore = defineStore('employee_settlements', () => {
  const listing = ref<Array<SettlementEmployee>>([])

  async function loading(orgId: number | null) {
    if (orgId) {
      const response = await supabase
        .from('employee_settlements')
        .select()
        .eq('organization', orgId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (response.status == 200) {
        const list: Array<SettlementEmployee> = []

        response.data?.forEach((json) => {
          const settlement = json as SettlementEmployee
          list.push(settlement)
        })

        listing.value = list
      } else {
        throw 'unexpended response status: ' + response.status
      }
    } else {
      listing.value = [] as Array<SettlementEmployee>
    }
  }

  function create(settlement: SettlementEmployeeCreate) {
    supabase
      .from('employee_settlements')
      .insert(settlement)
      .select()
      .then((response) => {
        if (response.status == 201) {
          response.data?.forEach((json) => {
            const settlement = json as SettlementEmployee
            listing.value.push(settlement)
          })
        }
      })
  }

  function update(id: number, settlement: SettlementEmployeeUpdate) {
    supabase
      .from('employee_settlements')
      .update(settlement)
      .eq('id', id)
      .select()
      .then((response) => {
        if (response.status == 200) {
          const list = listing.value
          response.data?.forEach((json) => {
            const settlement = json as SettlementEmployee
            const index = list.findIndex((v) => v.id == settlement.id)
            if (index < 0) {
              list.push(settlement)
            } else {
              list[index] = settlement
            }
          })

          listing.value = list
        }
      })
  }

  return { listing, loading, create, update }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSettlementsEmployeeStore, import.meta.hot))
}
