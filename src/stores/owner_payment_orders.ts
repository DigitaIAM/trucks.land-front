import { acceptHMRUpdate, defineStore } from 'pinia'

export interface PaymentToOwnerOrder extends PaymentToOwnerOrderCreate {
  id: number
  created_at: string
}

export interface PaymentToOwnerOrderCreate {
  created_by: number
  doc_payment: number
  doc_order: number
  order_cost: number
  amount: number
}

export const usePaymentToOwnerOrdersStore = defineStore('owner_payment_orders', () => {
  const listing = ref<Array<PaymentToOwnerOrder>>([])

  async function loading(documentId: number | null) {
    if (documentId) {
      const response = await supabase
        .from('owner_payment_orders')
        .select()
        .eq('doc_payment', documentId)

      // console.log('response', response)

      if (response.status == 200) {
        const list: Array<PaymentToOwnerOrder> = []

        response.data?.forEach((json) => {
          const record = json as PaymentToOwnerOrder
          list.push(record)
        })

        listing.value = list
        return list
      } else {
        throw 'unexpended response status: ' + response.status
      }
    } else {
      listing.value = [] as Array<PaymentToOwnerOrder>
      return []
    }
  }

  return { loading, listing }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePaymentToOwnerOrdersStore, import.meta.hot))
}
