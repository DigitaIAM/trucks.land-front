import { acceptHMRUpdate, defineStore } from 'pinia'

export interface PaymentToDispatcherOrder extends PaymentToDispatcherOrderCreate {
  id: number
  created_at: string
}

export interface PaymentToDispatcherOrderCreate {
  created_by: number
  doc_payment: number
  doc_order: number
  order_cost: number
  driver_cost: number
}

export const usePaymentToDispatcherOrdersStore = defineStore('employee_payment_orders', () => {
  const listing = ref<Array<PaymentToDispatcherOrder>>([])

  async function request(documentId: number | null): Promise<Array<PaymentToDispatcherOrder>> {
    if (documentId) {
      const response = await supabase
        .from('employee_payment_orders')
        .select()
        .eq('doc_payment', documentId)

      // console.log('response', response)

      if (response.status == 200) {
        const list: Array<PaymentToDispatcherOrder> = []

        response.data?.forEach((json) => {
          const record = json as PaymentToDispatcherOrder
          list.push(record)
        })

        return list
      } else {
        throw 'unexpended response status: ' + response.status
      }
    } else {
      return [] as Array<PaymentToDispatcherOrder>
    }
  }

  async function loading(documentId: number | null) {
    listing.value = await request(documentId)
  }

  return { request, loading, listing }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePaymentToDispatcherOrdersStore, import.meta.hot))
}
