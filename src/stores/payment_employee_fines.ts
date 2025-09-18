import { acceptHMRUpdate, defineStore } from 'pinia'

export interface PaymentEmployeeFines extends PaymentEmployeeFinesCreate {
  id: number
  created_at: string
}

export interface PaymentEmployeeFinesCreate {
  created_by: number
  document: number
  doc_fine: number
  amount: number
}

export const usePaymentToOwnerExpenseStore = defineStore('payment_employee_fines', () => {
  const listing = ref<Array<PaymentEmployeeFines>>([])

  async function loading(documentId: number | null) {
    if (documentId) {
      const response = await supabase
        .from('payment_employee_fines')
        .select()
        .eq('document', documentId)

      // console.log('response', response)

      if (response.status == 200) {
        const list: Array<PaymentEmployeeFines> = []

        response.data?.forEach((json) => {
          const fine = json as PaymentEmployeeFines
          list.push(fine)
        })

        listing.value = list
      } else {
        throw 'unexpended response status: ' + response.status
      }
    } else {
      listing.value = [] as Array<PaymentEmployeeFines>
    }
  }

  return { loading, listing }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePaymentToOwnerExpenseStore, import.meta.hot))
}
