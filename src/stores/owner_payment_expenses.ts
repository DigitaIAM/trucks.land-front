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

      if (response.status == 200) {
        const list: Array<ExpensesToOwner> = []

        response.data?.forEach((json) => {
          const expense = json['expense'] as ExpensesToOwner
          list.push(expense)
        })

        listing.value = list
        return list
      } else {
        throw 'unexpended response status: ' + response.status
      }
    } else {
      listing.value = [] as Array<ExpensesToOwner>
      return []
    }
  }

  async function create(record: PaymentToOwnerExpenseCreate) {
    const response = await supabase.from('owner_payment_expenses').insert(record).select()

    if (response.status == 201 && record.doc_payment) {
      await loading(record.doc_payment)
    }
  }

  async function updateAmount(docPayment: number, docExpense: number, amount: number) {
    await supabase
      .from('owner_payment_expenses')
      .update({ amount })
      .eq('doc_payment', docPayment)
      .eq('doc_expense', docExpense)

    await loading(docPayment)
  }

  return { loading, listing, create, updateAmount }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePaymentToOwnerExpenseStore, import.meta.hot))
}
