import { acceptHMRUpdate, defineStore } from 'pinia'

export interface QuickPays extends QuickPaysCreate {
  id: number
  created_at: string
  created_by: number
  organization: number
  stage: number
}

export interface QuickPaysCreate {
  order: number
  driver: number
  owner: number
  vehicle: number
  amount: number
  note: string
}

export interface QuickPaysUpdate {
  amount?: number
  note?: string
}

export const useQuickPaysStore = defineStore('quick_pays', () => {
  const listing = ref<Array<QuickPays>>([])

  const mapping = ref(new Map<number, QuickPays>())

  async function loading(orgId: number | null) {
    if (orgId) {
      const response = await supabase
        .from('quick_pays')
        .select()
        .eq('organization', orgId)
        .order('created_at', { ascending: false })

      if (response.status == 200) {
        const list: Array<QuickPays> = []

        response.data?.forEach((json) => {
          const qpay = json as QuickPays
          list.push(qpay)
        })
        listing.value = list
      } else {
        throw 'unexpended response status: ' + response.status
      }
    } else {
      listing.value = [] as Array<QuickPays>
    }
  }

  async function create(qpay: QuickPaysCreate, status: Status) {
    const response = await supabase.from('quick_pays').insert(qpay).select()

    if (response.status == 201 && response.data?.length == 1) {
      const qpay = response.data[0] as QuickPays
      mapping.value.set(qpay.id, qpay)

      return await changeStatus(qpay, status)
    } else {
      console.log('error', response)
      throw 'unexpended response status: ' + response.status
    }
  }

  function update(id: number, qpay: QuickPaysUpdate) {
    supabase
      .from('quick_pays')
      .update(qpay)
      .eq('id', id)
      .select()
      .then((response) => {
        if (response.status == 200) {
          const list = listing.value
          response.data?.forEach((json) => {
            const qpay = json as QuickPays
            const index = list.findIndex((v) => v.id == qpay.id)
            if (index < 0) {
              list.push(qpay)
            } else {
              list[index] = qpay
            }
          })

          listing.value = list
        }
      })
  }

  async function changeStatus(qpay: QuickPays, stage: Status) {
    const response = await supabase
      .from('quick_pay_stages')
      .insert({
        document: qpay.id,
        stage: stage.id,
      })
      .select()

    if (response.status == 201 && response.data?.length == 1) {
      qpay.stage = stage.id

      const map = new Map<number, QuickPays>(mapping.value)
      map.set(qpay.id, qpay)
      mapping.value = map

      return qpay
    } else {
      console.log('error', response)
      throw 'unexpended response status: ' + response.status
    }
  }

  return { listing, loading, create, update }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useQuickPaysStore, import.meta.hot))
}
