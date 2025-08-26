import { acceptHMRUpdate, defineStore } from 'pinia'

export interface PaymentToDispatcherOrder extends PaymentToDispatcherOrderCreate {
  id: number
  created_at: string
}

export interface PaymentToDispatcherOrderCreate {
  created_by: number
  document: number
  doc_order: number
  amount: number
  payment: number
}

export const usePaymentToDispatcherOrdersStore = defineStore(
  'payments_to_dispatchers_orders',
  () => {
    const listing = ref<Array<PaymentToDispatcherOrder>>([])

    async function loading(documentId: number | null) {
      if (documentId) {
        const response = await supabase
          .from('payments_to_dispatchers_orders')
          .select()
          .eq('document', documentId)

        // console.log('response', response)

        if (response.status == 200) {
          const list: Array<PaymentToDispatcherOrder> = []

          response.data?.forEach((json) => {
            const record = json as PaymentToDispatcherOrder
            list.push(record)
          })

          listing.value = list
        } else {
          throw 'unexpended response status: ' + response.status
        }
      } else {
        listing.value = [] as Array<PaymentToDispatcherOrder>
      }
    }

    return { loading, listing }
  },
)

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePaymentToDispatcherOrdersStore, import.meta.hot))
}
