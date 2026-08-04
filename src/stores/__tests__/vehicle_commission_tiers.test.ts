import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useVehicleCommissionTierStore } from '../vehicle_commission_tiers'

function mockQuery(data: unknown, status = 200) {
  const response = { data, status, error: null, count: null }
  const q = {
    select: vi.fn(() => q),
    eq: vi.fn(() => q),
    then: vi.fn((resolve: (v: typeof response) => void) => {
      resolve(response)
    }),
  }
  return q
}

beforeEach(() => {
  vi.clearAllMocks()
  setActivePinia(createPinia())
  ;(global.supabase.from as ReturnType<typeof vi.fn>).mockImplementation((t: string) =>
    t === 'vehicle_commission_tiers' ? mockQuery([]) : mockQuery([]),
  )
})

async function storeWithTiers(
  tiers: Array<{
    vehicle_type_id: number
    gross: string
    dispatch_fee: string
    dispatcher_commission: string
  }>,
) {
  const store = useVehicleCommissionTierStore()
  let guard = 0
  while (!store.initialized && guard++ < 100) {
    await new Promise((r) => setTimeout(r, 0))
  }
  store.$patch({ tiers })
  return store
}

describe('calcAmount', () => {
  it('applies 15% fee for V3418 weekly gross 7950 crossing top tier (6501)', async () => {
    const store = await storeWithTiers([
      { vehicle_type_id: 1, gross: '5000', dispatch_fee: '10', dispatcher_commission: '1' },
      { vehicle_type_id: 1, gross: '6500', dispatch_fee: '12', dispatcher_commission: '1.35' },
      { vehicle_type_id: 1, gross: '6501', dispatch_fee: '15', dispatcher_commission: '2.25' },
    ])

    expect(store.calcAmount(1000, 7950, 1)).toBe(850)
    expect(store.calcAmount(2900, 7950, 1)).toBe(2465)
    expect(store.calcAmount(2400, 7950, 1)).toBe(2040)
    expect(store.calcAmount(1650, 7950, 1)).toBe(1402.5)
  })

  it('applies 10% fee when gross is exactly at the first tier', async () => {
    const store = await storeWithTiers([
      { vehicle_type_id: 1, gross: '5000', dispatch_fee: '10', dispatcher_commission: '1' },
      { vehicle_type_id: 1, gross: '6501', dispatch_fee: '15', dispatcher_commission: '2.25' },
    ])

    expect(store.calcAmount(5000, 5000, 1)).toBe(4500)
    expect(store.calcAmount(3000, 5000, 1)).toBe(2700)
  })

  it('returns full orderCost when gross is below all tiers', async () => {
    const store = await storeWithTiers([
      { vehicle_type_id: 1, gross: '5000', dispatch_fee: '10', dispatcher_commission: '1' },
    ])

    expect(store.calcAmount(1000, 4000, 1)).toBe(1000)
  })

  it('returns full orderCost when no tiers exist for the vehicle type', async () => {
    const store = await storeWithTiers([
      { vehicle_type_id: 2, gross: '5000', dispatch_fee: '10', dispatcher_commission: '1' },
    ])

    expect(store.calcAmount(1000, 6000, 1)).toBe(1000)
  })

  it('picks highest applicable tier when gross exceeds multiple tiers', async () => {
    const store = await storeWithTiers([
      { vehicle_type_id: 1, gross: '3500', dispatch_fee: '10', dispatcher_commission: '1' },
      { vehicle_type_id: 1, gross: '5000', dispatch_fee: '12', dispatcher_commission: '1.5' },
      { vehicle_type_id: 1, gross: '5001', dispatch_fee: '15', dispatcher_commission: '2.25' },
    ])

    expect(store.calcAmount(7950, 7950, 1)).toBe(6757.5)
    expect(store.calcAmount(4000, 4000, 1)).toBe(3600)
    expect(store.calcAmount(5000, 5000, 1)).toBe(4400)
  })

  it('rounds result to 2 decimal places', async () => {
    const store = await storeWithTiers([
      { vehicle_type_id: 1, gross: '0', dispatch_fee: '10', dispatcher_commission: '1' },
    ])

    expect(store.calcAmount(333, 1000, 1)).toBe(299.7)
    expect(store.calcAmount(100, 1000, 1)).toBe(90)
  })
})

describe('week 31 owner calculation (vehicle_type_id 2)', () => {
  const tiers = [
    { vehicle_type_id: 2, gross: '3500', dispatch_fee: '10', dispatcher_commission: '1' },
    { vehicle_type_id: 2, gross: '5000', dispatch_fee: '12', dispatcher_commission: '1.5' },
    { vehicle_type_id: 2, gross: '5001', dispatch_fee: '15', dispatcher_commission: '2.25' },
  ]

  it('applies 15% dispatch fee to all week-31 orders (every vehicle exceeds 5001 gross)', async () => {
    const store = await storeWithTiers(tiers)

    expect(store.calcAmount(3900, 5900, 2)).toBe(3315)
    expect(store.calcAmount(2000, 5900, 2)).toBe(1700)

    expect(store.calcAmount(3500, 8150, 2)).toBe(2975)
    expect(store.calcAmount(1350, 8150, 2)).toBe(1147.5)
    expect(store.calcAmount(150, 8150, 2)).toBe(127.5)
    expect(store.calcAmount(750, 8150, 2)).toBe(637.5)
    expect(store.calcAmount(2400, 8150, 2)).toBe(2040)

    expect(store.calcAmount(2950, 9000, 2)).toBe(2507.5)
    expect(store.calcAmount(2700, 9000, 2)).toBe(2295)
    expect(store.calcAmount(1800, 9000, 2)).toBe(1530)
    expect(store.calcAmount(1550, 9000, 2)).toBe(1317.5)

    expect(store.calcAmount(1000, 7950, 2)).toBe(850)
    expect(store.calcAmount(2900, 7950, 2)).toBe(2465)
    expect(store.calcAmount(2400, 7950, 2)).toBe(2040)
    expect(store.calcAmount(1650, 7950, 2)).toBe(1402.5)
  })

  it('computes week-31 totals per owner', async () => {
    const store = await storeWithTiers(tiers)

    const halaFood =
      store.calcAmount(3900, 5900, 2) +
      store.calcAmount(2000, 5900, 2) +
      store.calcAmount(3500, 8150, 2) +
      store.calcAmount(1350, 8150, 2) +
      store.calcAmount(150, 8150, 2) +
      store.calcAmount(750, 8150, 2) +
      store.calcAmount(2400, 8150, 2) +
      store.calcAmount(2950, 9000, 2) +
      store.calcAmount(2700, 9000, 2) +
      store.calcAmount(1800, 9000, 2) +
      store.calcAmount(1550, 9000, 2)

    const frEmpireLog =
      store.calcAmount(1000, 7950, 2) +
      store.calcAmount(2900, 7950, 2) +
      store.calcAmount(2400, 7950, 2) +
      store.calcAmount(1650, 7950, 2)

    expect(halaFood).toBe(19592.5)
    expect(frEmpireLog).toBe(6757.5)
  })
})
