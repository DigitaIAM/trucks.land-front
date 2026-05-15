import { acceptHMRUpdate, defineStore } from 'pinia'

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

  async function loading(orgId: number | null) {
    console.log('orgId', orgId)
    if (orgId) {
      const response = await supabase
        .from('employee_settlements')
        .select()
        .eq('organization', orgId)
        .order('created_at', { ascending: false })
        .limit(20)

      console.log('employee_settlements', response)

      if (response.status == 200) {
        const list: Array<SettlementEmployee> = []

        response.data?.forEach((json) => {
          const settlement = json as SettlementEmployee
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

  return { listing, loading, create, update }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSettlementsEmployeeStore, import.meta.hot))
}
