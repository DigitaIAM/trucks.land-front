import { acceptHMRUpdate, defineStore } from 'pinia'
import type { ExpensesToOwner } from '@/stores/expenses_owner.ts'

export interface PaymentToOwnerExpense extends PaymentToOwnerExpenseCreate {
  id: number
  created_at: string
}

export interface PaymentToOwnerExpenseCreate {
  created_by: number
  document: number
  doc_expense: number
  amount: number
}

export const usePaymentToOwnerExpenseStore = defineStore('payments_to_owners_expenses', () => {
  const listing = ref<Array<ExpensesToOwner>>([])

  async function loading(documentId: number | null) {
    if (documentId) {
      const response = await supabase
        .from('payments_to_owners_expenses')
        .select('*, expense:expenses_to_owner(*)')
        .eq('document', documentId)

      // console.log('response', response)

      if (response.status == 200) {
        const list: Array<ExpensesToOwner> = []

        response.data?.forEach((json) => {
          const expense = json['expense'] as ExpensesToOwner
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

  return { loading, listing }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePaymentToOwnerExpenseStore, import.meta.hot))
}
