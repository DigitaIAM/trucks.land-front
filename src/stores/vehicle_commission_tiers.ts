import { acceptHMRUpdate, defineStore } from 'pinia'

export interface VehicleCommissionTier {
  id: number
  vehicle_type_id: number
  gross: number
  dispatch_fee: number
  dispatcher_commission: number
  deleted: boolean
}

export const useVehicleCommissionTierStore = defineStore('vehicle_commission_tiers', () => {
  const tiers = ref<Array<VehicleCommissionTier>>([])

  const { initialized, loading } = useInitializeStore(async () => {
    const response = await supabase.from('vehicle_commission_tiers').select().eq('deleted', false)

    tiers.value = (response.data as Array<VehicleCommissionTier>) ?? []
  })

  function calcAmount(orderCost: number, vehicleTypeId: number): number {
    const applicable = tiers.value
      .filter((t) => t.vehicle_type_id === vehicleTypeId)
      .sort((a, b) => b.gross - a.gross)

    const tier = applicable.find((t) => orderCost >= t.gross)
    if (!tier) return orderCost

    return Math.round(orderCost * (1 - tier.dispatch_fee / 100) * 100) / 100
  }

  return { tiers, initialized, loading, calcAmount }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useVehicleCommissionTierStore, import.meta.hot))
}
