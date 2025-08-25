import { acceptHMRUpdate, defineStore } from 'pinia'

export interface PaymentToOwnerOrder extends PaymentToOwnerOrderCreate {
  id: number
  created_at: string
}

export interface PaymentToOwnerOrderCreate {
  created_by: number
  document: number
  doc_order: number
  amount: number
  payment: number
}

export const usePaymentToOwnerOrdersStore = defineStore('payments_to_owners_orders', () => {
  const listing = ref<Array<PaymentToOwnerOrder>>([])

  async function loading(documentId: number | null) {
    if (documentId) {
      const response = await supabase
        .from('payments_to_owners_orders')
        .select()
        .eq('document', documentId)

      // console.log('response', response)

      if (response.status == 200) {
        const list: Array<PaymentToOwnerOrder> = []

        response.data?.forEach((json) => {
          const record = json as PaymentToOwnerOrder
          list.push(record)
        })

        listing.value = list
      } else {
        throw 'unexpended response status: ' + response.status
      }
    } else {
      listing.value = [] as Array<PaymentToOwnerOrder>
    }
  }

  return { loading, listing }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePaymentToOwnerOrdersStore, import.meta.hot))
}
