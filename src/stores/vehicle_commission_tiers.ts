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
    // console.log('loading tiers...')
    const response = await supabase.from('vehicle_commission_tiers').select().eq('deleted', false)
    // console.log('tiers response:', response.data, response.error)
    tiers.value = (response.data as Array<VehicleCommissionTier>) ?? []
  })

  // watch(
  //   tiers,
  //   (val) => {
  //     console.log('tiers loaded:', val)
  //     console.log('test calcAmount(6000, 7100, 2):', calcAmount(6000, 7100, 2)) // ← обновить
  //   },
  //   { immediate: true },
  // )

  function calcAmount(orderCost: number, weeklyGross: number, vehicleTypeId: number): number {
    const applicable = tiers.value
      .filter((t) => t.vehicle_type_id === vehicleTypeId)
      .sort((a, b) => Number(b.gross) - Number(a.gross))

    const tier = applicable.find((t) => weeklyGross >= Number(t.gross))
    if (!tier) return orderCost

    return Math.round(orderCost * (1 - Number(tier.dispatch_fee) / 100) * 100) / 100
  }

  return { tiers, initialized, loading, calcAmount }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useVehicleCommissionTierStore, import.meta.hot))
}
