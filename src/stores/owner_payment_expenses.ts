import { acceptHMRUpdate, defineStore } from 'pinia'
import type { ExpensesToOwner } from '@/stores/owner_expenses.ts'

export interface PaymentToOwnerExpense extends PaymentToOwnerExpenseCreate {
  id: number
  created_at: string
}

export interface PaymentToOwnerExpenseCreate {
  created_by: number
  doc_payment: number
  doc_expense: number
  amount: number
}

export const usePaymentToOwnerExpenseStore = defineStore('owner_payment_expenses', () => {
  const listing = ref<Array<ExpensesToOwner>>([])

  async function loading(documentId: number | null) {
    if (documentId) {
      const response = await supabase
        .from('owner_payment_expenses')
        .select('*, expense:owner_expenses(*)')
        .eq('doc_payment', documentId)

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
