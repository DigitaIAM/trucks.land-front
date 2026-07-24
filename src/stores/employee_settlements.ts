import { acceptHMRUpdate, defineStore } from 'pinia'
import type { KV } from '@/utils/kv.ts'

export interface SettlementEmployee extends SettlementEmployeeCreate {
  id: number
  created_at: string
  created_by: number
}

export interface SettlementEmployeeCreate {
  organization: number
  employee: number
  notes: string
  amount: number
  settlement_type: number
  currency: string
}

export interface SettlementEmployeeUpdate {
  employee?: number
  notes?: string
  amount?: number
  settlement_type?: number
  currency?: string
}

export const useSettlementsEmployeeStore = defineStore('employee_settlements', () => {
  const listing = ref<Array<SettlementEmployee>>([])

  const contextFilters = ref<Array<KV>>([])
  const searchFilters = ref<Array<KV>>([])

  const timestamp = ref(Date.now())

  async function setContext(filters: Array<KV>) {
    contextFilters.value = filters
    await _setFilters()
  }

  async function setFilters(filters: Array<KV>) {
    searchFilters.value = filters
    await _setFilters()
  }

  async function _setFilters() {
    const localTime = Date.now()

    if (timestamp.value > localTime) {
      return
    }
    timestamp.value = localTime

    let query = supabase.from('employee_settlements').select()

    const allFilters = contextFilters.value.concat(searchFilters.value)

    allFilters.forEach((f) => {
      const x = f.val

      if (f.key === 'created_at_range') {
        query = query.gte('created_at', x.start).lt('created_at', x.end)
        return
      }

      if (typeof x === 'object' && !Array.isArray(x) && x !== null) {
        query = query.eq(f.key, x.id)
      } else if (Array.isArray(x)) {
        query = query.in(f.key, x)
      } else {
        query = query.eq(f.key, x)
      }
    })

    const response = await query.order('created_at', { ascending: false }).limit(50)

    if (timestamp.value == localTime) {
      if (response.status == 200) {
        const list: Array<SettlementEmployee> = []
        response.data?.forEach((json) => {
          list.push(json as SettlementEmployee)
        })
        listing.value = list
      } else {
        throw 'unexpected response status: ' + response.status
      }
    }
  }

  async function create(settlement: SettlementEmployeeCreate): Promise<SettlementEmployee | null> {
    const response = await supabase.from('employee_settlements').insert(settlement).select() // Возвращает массив [ {id: 1, ...} ]

    if (response.error) {
      console.error('Create settlement error:', response.error)
      throw response.error
    }

    // Проверяем, что массив не пустой
    if (response.data && response.data.length > 0) {
      const newSettlement = response.data[0] as SettlementEmployee

      // Обновляем локальный список в сторе
      listing.value.push(newSettlement)

      // Возвращаем объект наружу
      return newSettlement
    }

    return null
  }

  async function update(
    id: number,
    settlement: SettlementEmployeeUpdate,
  ): Promise<SettlementEmployee | null> {
    const response = await supabase
      .from('employee_settlements')
      .update(settlement)
      .eq('id', id)
      .select() // Возвращает массив [ {id: 1, ...} ]

    if (response.error) {
      console.error('Update settlement error:', response.error)
      throw response.error
    }

    if (response.data && response.data.length > 0) {
      const updatedSettlement = response.data[0] as SettlementEmployee

      const index = listing.value.findIndex((v) => v.id == updatedSettlement.id)
      if (index < 0) {
        listing.value.push(updatedSettlement)
      } else {
        listing.value[index] = updatedSettlement
      }

      return updatedSettlement
    }

    return null
  }

  return { listing, setContext, setFilters, create, update }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSettlementsEmployeeStore, import.meta.hot))
}
