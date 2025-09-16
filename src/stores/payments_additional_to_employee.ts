import { acceptHMRUpdate, defineStore } from 'pinia'

export interface PaymentsAdditionalToEmployee extends PaymentsAdditionalToEmployeeCreate {
  id: number
  created_at: string
  organization: number
}

export interface PaymentsAdditionalToEmployeeCreate {
  organization: number
  employee: number
  kind: string
  amount: number
  created_by: number
}

export interface PaymentsAdditionalToEmployeeUpdate {
  employee?: number
  kind?: string
  amount?: number
}

export const usePaymentsAdditionalToEmployeeStore = defineStore(
  'payments_additional_to_employee',
  () => {
    const listing = ref<Array<PaymentsAdditionalToEmployee>>([])

    async function loading(orgId: number | null) {
      if (orgId) {
        const response = await supabase
          .from('payments_additional_to_employee')
          .select()
          .eq('organization', orgId)
          .order('created_at', { ascending: false })
          .limit(50)

        if (response.status == 200) {
          const list: Array<PaymentsAdditionalToEmployee> = []

          response.data?.forEach((json) => {
            const payment = json as PaymentsAdditionalToEmployee
            list.push(payment)
          })

          listing.value = list
        } else {
          throw 'unexpended response status: ' + response.status
        }
      } else {
        listing.value = [] as Array<PaymentsAdditionalToEmployee>
      }
    }

    function create(payment: PaymentsAdditionalToEmployeeCreate) {
      supabase
        .from('payments_additional_to_employee')
        .insert(payment)
        .select()
        .then((response) => {
          if (response.status == 201) {
            response.data?.forEach((json) => {
              const payment = json as PaymentsAdditionalToEmployee
              listing.value.push(payment)
            })
          }
        })
      console.log('create', payment)
    }

    function update(id: number, payment: PaymentsAdditionalToEmployeeUpdate) {
      supabase
        .from('payments_additional_to_employee')
        .update(payment)
        .eq('id', id)
        .select()
        .then((response) => {
          if (response.status == 200) {
            const list = listing.value
            response.data?.forEach((json) => {
              const payment = json as PaymentsAdditionalToEmployee
              const index = list.findIndex((v) => v.id == payment.id)
              if (index < 0) {
                list.push(payment)
              } else {
                list[index] = payment
              }
            })

            listing.value = list
          }
        })
    }

    return { listing, loading, create, update }
  },
)

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePaymentsAdditionalToEmployeeStore, import.meta.hot))
}
