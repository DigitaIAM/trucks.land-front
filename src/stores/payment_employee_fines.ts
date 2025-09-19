import { acceptHMRUpdate, defineStore } from 'pinia'
import type { FinesEmployee } from '@/stores/fines_employee.ts'

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

export const usePaymentEmployeeFinesStore = defineStore('payment_employee_fines', () => {
  const listing = ref<Array<PaymentEmployeeFines>>([])

  async function loading(documentId: number | null) {
    if (documentId) {
      const response = await supabase
        .from('payment_employee_fines')
        .select('*, fine:employee_fines(*)')
        .eq('document', documentId)

      // console.log('response', response)

      if (response.status == 200) {
        const list: Array<PaymentEmployeeFines> = []

        response.data?.forEach((json) => {
          const fine = json['fine'] as FinesEmployee
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
  import.meta.hot.accept(acceptHMRUpdate(usePaymentEmployeeFinesStore, import.meta.hot))
}
