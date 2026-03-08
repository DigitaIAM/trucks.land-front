import { acceptHMRUpdate, defineStore } from 'pinia'
import type { Order } from '@/stores/orders.ts'
import type { KV } from '@/utils/kv.ts'

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
  qp_percent: number
  qp_to_pay: number
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
  percent: number
  to_pay: number
  note: string
}

export interface QuickPayUpdate {
  amount?: number
  percent?: number
  to_pay?: number
  note?: string
}

export const useQuickPaysStore = defineStore('quick_pays', () => {
  const contextFilters = ref<Array<KV>>([])
  const searchFilters = ref<Array<KV>>([])

  const timestamp = ref(Date.now())
  const listing = ref<Array<OrderAndQuickPay>>([])

  async function setContext(filters: Array<KV>) {
    contextFilters.value = filters

    await _setFilters()
  }

  async function setFilters(filters: Array<KV>) {
    searchFilters.value = filters

    await _setFilters()
  }

  async function _setFilters() {
    listing.value = new Array<OrderAndQuickPay>()

    const localTime = Date.now()

    if (timestamp.value > localTime) {
      return
    }
    timestamp.value = localTime

    let query = supabase.from('quick_pays_journal').select()

    let limit = 20

    contextFilters.value.concat(searchFilters.value).forEach((f) => {
      const x = f.val
      if (f.key === 'table') {
        // ignore
      } else if (f.key === 'limit') {
        limit = f.val
      } else if (x === null || x === undefined) {
        query = query.is(f.key, null)
      } else if (typeof x === 'object' && !Array.isArray(x)) {
        query = query.eq(f.key, x.id)
      } else if (Array.isArray(x)) {
        query = query.in(f.key, x)
      } else {
        query = query.eq(f.key, x)
      }
    })

    query = query.order('created_at', { ascending: false })

    if (limit > 0) {
      query = query.limit(limit)
    }

    const response = await query

    if (timestamp.value == localTime) {
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

  async function update(id: number, qpay: QuickPayUpdate | null, stage: Status) {
    if (qpay) {
      const response = await supabase.from('quick_pays').update(qpay).eq('id', id).select()

      if (response.status == 200) {
        await changeStatus(id, stage)
      } else {
        console.log('error', response)
        throw 'unexpended response status: ' + response.status
      }
    } else {
      await changeStatus(id, stage)
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

  return { setContext, setFilters, listing, create, changeStatus, update }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useQuickPaysStore, import.meta.hot))
}
