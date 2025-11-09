import { acceptHMRUpdate, defineStore } from 'pinia'

export interface ExpensesToOwner extends ExpensesToOwnerCreate {
  id: number
  created_at: string
  created_by: number
  organization: number
}

export interface ExpensesToOwnerCreate {
  organization: number
  owner: number
  notes: string
  amount: number
}

export interface ExpensesToOwnerUpdate {
  owner?: number
  notes?: string
  amount?: number
}

export const useExpensesToOwnerStore = defineStore('owner_expenses', () => {
  const listing = ref<Array<ExpensesToOwner>>([])

  async function loading(orgId: number | null) {
    if (orgId) {
      const response = await supabase
        .from('owner_expenses')
        .select()
        .eq('organization', orgId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (response.status == 200) {
        const list: Array<ExpensesToOwner> = []

        response.data?.forEach((json) => {
          const expense = json as ExpensesToOwner
          list.push(expense)
        })

        listing.value = list
      } else {
        throw 'unexpended response status: ' + response.status
      }
    } else {
      listing.value = [] as Array<ExpensesToOwner>
    }
  }

  function create(expense: ExpensesToOwnerCreate) {
    supabase
      .from('owner_expenses')
      .insert(expense)
      .select()
      .then((response) => {
        if (response.status == 201) {
          response.data?.forEach((json) => {
            const expense = json as ExpensesToOwner
            listing.value.push(expense)
          })
        }
      })
  }

  function update(id: number, expense: ExpensesToOwnerUpdate) {
    supabase
      .from('owner_expenses')
      .update(expense)
      .eq('id', id)
      .select()
      .then((response) => {
        if (response.status == 200) {
          const list = listing.value
          response.data?.forEach((json) => {
            const expense = json as ExpensesToOwner
            const index = list.findIndex((v) => v.id == expense.id)
            if (index < 0) {
              list.push(expense)
            } else {
              list[index] = expense
            }
          })

          listing.value = list
        }
      })
  }

  return { listing, loading, create, update }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useExpensesToOwnerStore, import.meta.hot))
}
