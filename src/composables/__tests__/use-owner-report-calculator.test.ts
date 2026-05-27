import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Mock } from 'vitest'

function mockQuery(data: unknown, status = 200) {
  const response = { data, status, error: null, count: null }
  const q = {
    select: vi.fn(() => q),
    eq: vi.fn(() => q),
    is: vi.fn(() => q),
    gte: vi.fn(() => q),
    lte: vi.fn(() => q),
    order: vi.fn(() => q),
    limit: vi.fn(() => q),
    maybeSingle: vi.fn(() => q),
    then: vi.fn((resolve: (v: typeof response) => void) => {
      resolve(response)
    }),
  }
  return q
}

function mockFromFor(table: string) {
  const from = global.supabase.from as Mock
  from.mockImplementation((t: string) =>
    t === table ? mockQuery(mockTableData[table] ?? []) : mockQuery([]),
  )
}

const mockTableData: Record<string, unknown> = {}

beforeEach(() => {
  vi.clearAllMocks()
  for (const key of Object.keys(mockTableData)) {
    delete mockTableData[key]
  }
})

import {
  loadOwnerPayments,
  loadOwnerExpenses,
  calculateOwnerReport,
} from '../use-owner-report-calculator'

describe('loadOwnerPayments', () => {
  beforeEach(() => {
    mockFromFor('owner_unpaid_orders')
  })

  it('returns empty map when no data', async () => {
    const result = await loadOwnerPayments(1)
    expect(result.size).toBe(0)
  })

  it('groups payments by owner', async () => {
    mockTableData['owner_unpaid_orders'] = [
      { id: 1, owner: 100, driver_cost: 500, cost: 1000, organization: 1 },
      { id: 2, owner: 100, driver_cost: 300, cost: 800, organization: 1 },
      { id: 3, owner: 200, driver_cost: 700, cost: 1500, organization: 1 },
    ]

    const result = await loadOwnerPayments(1)
    expect(result.size).toBe(2)
    expect(result.get(100)).toHaveLength(2)
    expect(result.get(200)).toHaveLength(1)
  })

  it('sets driver_payment from driver_cost field', async () => {
    mockTableData['owner_unpaid_orders'] = [
      { id: 1, owner: 100, driver_cost: 500, cost: 1000, organization: 1 },
    ]

    const result = await loadOwnerPayments(1)
    expect(result.get(100)![0].driver_payment).toBe(500)
  })
})

describe('loadOwnerExpenses', () => {
  beforeEach(() => {
    mockFromFor('owner_unpaid_expenses')
  })

  it('returns empty map when no data', async () => {
    const result = await loadOwnerExpenses(1)
    expect(result.size).toBe(0)
  })

  it('groups expenses by owner', async () => {
    mockTableData['owner_unpaid_expenses'] = [
      { id: 1, owner: 100, amount: 200, notes: 'repair', organization: 1 },
      { id: 2, owner: 100, amount: 50, notes: 'fuel', organization: 1 },
      { id: 3, owner: 200, amount: 100, notes: 'toll', organization: 1 },
    ]

    const result = await loadOwnerExpenses(1)
    expect(result.size).toBe(2)
    expect(result.get(100)).toHaveLength(2)
    expect(result.get(200)).toHaveLength(1)
  })
})

describe('calculateOwnerReport', () => {
  it('returns empty array when no data', async () => {
    const result = await calculateOwnerReport(new Map(), new Map(), null)
    expect(result).toEqual([])
  })

  it('calculates report for a single owner with orders', async () => {
    const payments = new Map()
    payments.set(100, [
      {
        owner: 100,
        driver_payment: 600,
        order: { id: 1, cost: 1000, driver_cost: 600, owner: 100, stage: 2, organization: 1 } as any,
      },
    ])

    const result = await calculateOwnerReport(payments, new Map(), null)
    expect(result).toHaveLength(1)
    expect(result[0].owner).toBe(100)
    expect(result[0].orders_number).toBe(1)
    expect(result[0].orders_amount).toBe(1000)
    expect(result[0].orders_driver).toBe(600)
    expect(result[0].payout).toBe(600) // no expenses
  })

  it('subtracts expenses from payout', async () => {
    const payments = new Map()
    payments.set(100, [
      {
        owner: 100,
        driver_payment: 600,
        order: { id: 1, cost: 1000, driver_cost: 600, owner: 100, stage: 2, organization: 1 } as any,
      },
    ])

    const expenses = new Map()
    expenses.set(100, [
      { id: 1, owner: 100, amount: 150, notes: 'repair', organization: 1 } as any,
    ])

    const result = await calculateOwnerReport(payments, expenses, null)
    expect(result[0].payout).toBe(450) // 600 - 150
    expect(result[0].expenses_total).toBe(150)
  })

  it('excludes orders with stage 3 from payout calculation', async () => {
    const payments = new Map()
    payments.set(100, [
      {
        owner: 100,
        driver_payment: 600,
        order: { id: 1, cost: 1000, driver_cost: 600, owner: 100, stage: 3, organization: 1 } as any,
      },
    ])

    const result = await calculateOwnerReport(payments, new Map(), null)
    expect(result[0].orders_amount).toBe(0)
    expect(result[0].orders_driver).toBe(0)
    expect(result[0].payout).toBe(0)
    // but the order is still counted
    expect(result[0].orders_number).toBe(1)
  })

  it('includes owners with negative payout', async () => {
    const payments = new Map()
    payments.set(100, [
      {
        owner: 100,
        driver_payment: 100,
        order: { id: 1, cost: 1000, driver_cost: 100, owner: 100, stage: 2, organization: 1 } as any,
      },
    ])

    const expenses = new Map()
    expenses.set(100, [
      { id: 1, owner: 100, amount: 500, notes: 'repair', organization: 1 } as any,
    ])

    const result = await calculateOwnerReport(payments, expenses, null)
    expect(result[0].payout).toBe(-400)
  })

  it('sorts by payout descending', async () => {
    const payments = new Map()
    payments.set(100, [
      {
        owner: 100,
        driver_payment: 200,
        order: { id: 1, cost: 1000, driver_cost: 200, owner: 100, stage: 2, organization: 1 } as any,
      },
    ])
    payments.set(200, [
      {
        owner: 200,
        driver_payment: 800,
        order: { id: 2, cost: 2000, driver_cost: 800, owner: 200, stage: 2, organization: 1 } as any,
      },
    ])

    const result = await calculateOwnerReport(payments, new Map(), null)
    expect(result).toHaveLength(2)
    expect(result[0].owner).toBe(200) // 800 payout
    expect(result[1].owner).toBe(100) // 200 payout
  })

  it('filters by search query matching owner name', async () => {
    const mockResolve = vi.fn(async (id: number) =>
      id === 100 ? { id: 100, name: 'Alpha Transport' } : { id: 200, name: 'Beta Logistics' },
    )
    ;(useOwnersStore as unknown as Mock).mockImplementationOnce(() => ({ resolve: mockResolve }))

    const payments = new Map()
    payments.set(100, [
      {
        owner: 100,
        driver_payment: 600,
        order: { id: 1, cost: 1000, driver_cost: 600, owner: 100, stage: 2, organization: 1 } as any,
      },
    ])
    payments.set(200, [
      {
        owner: 200,
        driver_payment: 800,
        order: { id: 2, cost: 2000, driver_cost: 800, owner: 200, stage: 2, organization: 1 } as any,
      },
    ])

    const result = await calculateOwnerReport(payments, new Map(), 'alpha')
    expect(result).toHaveLength(1)
    expect(result[0].owner).toBe(100)
  })
})
