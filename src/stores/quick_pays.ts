import { acceptHMRUpdate, defineStore } from 'pinia'
import type { Order } from '@/stores/orders.ts'

export interface OrderAndQuickPay extends Order {
  qp_id: number
  qp_created_at: string
  qp_created_by: number
  qp_organization: number
  qp_stage: number

  qp_document: number
  qp_driver: number
  qp_owner: number
  qp_vehicle: number
  qp_amount: number
  qp_note: string
}

export interface QuickPay extends QuickPayCreate {
  id: number
  created_at: string
  created_by: number
  organization: number
  stage: number
}

export interface QuickPayCreate {
  document: number
  driver: number
  owner: number
  vehicle: number
  amount: number
  note: string
}

export const useQuickPaysStore = defineStore('quick_pays', () => {
  const listing = ref<Array<OrderAndQuickPay>>([])

  async function loading(orgId: number | null) {
    if (orgId) {
      const response = await supabase
        .from('quick_pays_journal')
        .select()
        .eq('organization', orgId)
        .eq('qp_stage', 9)
        .order('created_at', { ascending: false })

      if (response.status == 200) {
        const list: Array<OrderAndQuickPay> = []

        response.data?.forEach((json) => {
          const qpay = json as OrderAndQuickPay
          list.push(qpay)
        })
        listing.value = list
      } else {
        throw 'unexpended response status: ' + response.status
      }
    } else {
      listing.value = [] as Array<OrderAndQuickPay>
    }
  }

  async function create(qpay: QuickPayCreate, stage: Status) {
    const response = await supabase.from('quick_pays').insert(qpay).select()

    if (response.status == 201 && response.data?.length == 1) {
      const qpay = response.data[0] as QuickPay
      // mapping.value.set(qpay.id, qpay)

      await changeStatus(qpay.id, stage)

      qpay.stage = stage.id

      return qpay
    } else {
      console.log('error', response)
      throw 'unexpended response status: ' + response.status
    }
  }

  async function changeStatus(qp_id: number, stage: Status) {
    const response = await supabase
      .from('quick_pay_stages')
      .insert({
        document: qp_id,
        stage: stage.id,
      })
      .select()

    if (response.status == 201 && response.data?.length == 1) {
      const list: Array<OrderAndQuickPay> = []

      listing.value.forEach((rec) => {
        if (rec.qp_id === qp_id) {
          if (stage.id == 9) {
            rec.qp_stage = stage.id
            list.push(rec)
          } else {
            // delete
          }
        } else {
          list.push(rec)
        }
      })

      listing.value = list
    } else {
      console.log('error', response)
      throw 'unexpended response status: ' + response.status
    }
  }

  return { listing, loading, create, changeStatus }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useQuickPaysStore, import.meta.hot))
}
