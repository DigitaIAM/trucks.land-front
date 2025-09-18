import { acceptHMRUpdate, defineStore } from 'pinia'
import type { ExpensesToOwner } from '@/stores/expenses_owner.ts'

export interface PaymentsToEmployeeAdditional extends PaymentsToEmployeeAdditionalCreate {
  id: number
  created_at: string
}

export interface PaymentsToEmployeeAdditionalCreate {
  created_by: number
  document: number
  doc_additional_payment: number
  amount: number
}

export const usePaymentsToEmployeeAdditionalStore = defineStore(
  'payments_to_employee_additional',
  () => {
    const listing = ref<Array<PaymentsToEmployeeAdditional>>([])

    async function loading(documentId: number | null) {
      if (documentId) {
        const response = await supabase
          .from('payments_to_employee_additional')
          .select()
          .eq('document', documentId)

        // console.log('response', response)

        if (response.status == 200) {
          const list: Array<PaymentsToEmployeeAdditional> = []

          response.data?.forEach((json) => {
            const paymentAdd = json as PaymentsToEmployeeAdditional
            list.push(paymentAdd)
          })

          listing.value = list
        } else {
          throw 'unexpended response status: ' + response.status
        }
      } else {
        listing.value = [] as Array<PaymentsToEmployeeAdditional>
      }
    }

    return { loading, listing }
  },
)

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePaymentsToEmployeeAdditionalStore, import.meta.hot))
}
