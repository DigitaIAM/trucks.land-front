import { acceptHMRUpdate, defineStore } from 'pinia'
import type { SettlementEmployee } from '@/stores/employee_settlements.ts'

export interface EmployeePaymentSettlements extends EmployeePaymentSettlementsCreate {
  id: number
  created_at: string
}

export interface EmployeePaymentSettlementsCreate {
  created_by: number
  doc_payment: number
  doc_settlements: number
  amount: number
}

export const useEmployeePaymentSettlementsStore = defineStore(
  'employee_payment_settlements',
  () => {
    const listing = ref<Array<SettlementEmployee>>([])

    async function loading(documentId: number | null) {
      if (documentId) {
        const response = await supabase
          .from('employee_payment_settlements')
          .select('*, settlement:employee_settlements(*)')
          .eq('doc_payment', documentId)

        // console.log('response', response)

        if (response.status == 200) {
          const list: Array<SettlementEmployee> = []

          response.data?.forEach((json) => {
            const settlement = json['settlement'] as SettlementEmployee
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

    return { loading, listing }
  },
)

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useEmployeePaymentSettlementsStore, import.meta.hot))
}
