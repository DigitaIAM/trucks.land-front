import { describe, it, expect, vi, beforeEach } from 'vitest'
import dayjs from 'dayjs'
import type { Mock } from 'vitest'

function mockQuery(data: unknown, status = 200) {
  const response = { data, status, error: null, count: null }
  const q = {
    select: vi.fn(() => q),
    eq: vi.fn(() => q),
    is: vi.fn(() => q),
    in: vi.fn(() => q),
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
  getWorkingDaysInRange,
  loadOrdersInProgress,
  loadUnpaidOrders,
  loadUnpaidSettlements,
  calculateEmployeeReport,
  calculateWeeklyLeasingCommission,
} from '../use-employee-report-calculator'

describe('getWorkingDaysInRange', () => {
  it('returns 0 when start and end are the same Sunday', () => {
    const sunday = dayjs('2026-05-31')
    expect(getWorkingDaysInRange(sunday, sunday)).toBe(0)
  })

  it('returns 1 when start and end are the same weekday', () => {
    const monday = dayjs('2026-06-01')
    expect(getWorkingDaysInRange(monday, monday)).toBe(1)
  })

  it('counts working days in a Mon-Fri range (no Sundays)', () => {
    const start = dayjs('2026-06-01') // Monday
    const end = dayjs('2026-06-05') // Friday
    expect(getWorkingDaysInRange(start, end)).toBe(5)
  })

  it('skips Sunday in the middle of the range', () => {
    const start = dayjs('2026-05-28') // Thursday
    const end = dayjs('2026-06-01') // Monday
    // Thu(1) Fri(1) Sat(1) Sun(0) Mon(1) = 4
    expect(getWorkingDaysInRange(start, end)).toBe(4)
  })

  it('skips multiple Sundays over two weeks', () => {
    const start = dayjs('2026-06-01') // Monday
    const end = dayjs('2026-06-14') // Sunday (two Sundays: 7th, 14th)
    // 14 days - 2 Sundays = 12
    expect(getWorkingDaysInRange(start, end)).toBe(12)
  })

  it('handles start on Sunday', () => {
    const start = dayjs('2026-05-31') // Sunday
    const end = dayjs('2026-06-02') // Tuesday
    expect(getWorkingDaysInRange(start, end)).toBe(2) // Mon, Tue
  })

  it('handles end on Sunday', () => {
    const start = dayjs('2026-05-25') // Monday
    const end = dayjs('2026-05-31') // Sunday
    // Mon-Sat = 6 (Sun excluded, but loop still runs on Sun and skips it)
    expect(getWorkingDaysInRange(start, end)).toBe(6)
  })
})

describe('loadOrdersInProgress', () => {
  beforeEach(() => {
    mockFromFor('orders_journal')
  })

  it('returns empty map when no data', async () => {
    const result = await loadOrdersInProgress(1)
    expect(result.size).toBe(0)
  })

  it('groups orders by created_by', async () => {
    mockTableData['orders_journal'] = [
      { id: 1, created_by: 10, cost: 100, driver_cost: 50, stage: 2, organization: 1 },
      { id: 2, created_by: 10, cost: 200, driver_cost: 80, stage: 1, organization: 1 },
      { id: 3, created_by: 20, cost: 300, driver_cost: 150, stage: 2, organization: 1 },
    ]

    const result = await loadOrdersInProgress(1)
    expect(result.size).toBe(2)
    expect(result.get(10)).toHaveLength(2)
    expect(result.get(20)).toHaveLength(1)
  })

  it('queries with correct filters', async () => {
    await loadOrdersInProgress(5)

    const fromMock = global.supabase.from as Mock
    expect(fromMock).toHaveBeenCalledWith('orders_journal')

    const query = fromMock.mock.results[0].value as ReturnType<typeof mockQuery>
    expect(query.eq).toHaveBeenCalledWith('organization', 5)
    expect(query.is).toHaveBeenCalledWith('year', null)
    expect(query.gte).toHaveBeenCalledWith('created_at', '2026-02-24')
  })
})

describe('loadUnpaidOrders', () => {
  beforeEach(() => {
    mockFromFor('employee_unpaid_orders')
  })

  it('returns empty map when no data', async () => {
    const result = await loadUnpaidOrders(1)
    expect(result.size).toBe(0)
  })

  it('groups by created_by', async () => {
    mockTableData['employee_unpaid_orders'] = [
      { id: 1, created_by: 10, employee: 10, vehicle_found_by: null, cost: 500, driver_cost: 200 },
    ]

    const result = await loadUnpaidOrders(1)
    expect(result.size).toBe(1)
    expect(result.get(10)).toHaveLength(1)
    expect(result.get(10)![0].employee).toBe(10)
  })

  it('creates separate entries for vehicle_found_by', async () => {
    mockTableData['employee_unpaid_orders'] = [
      { id: 1, created_by: 10, employee: 10, vehicle_found_by: 20, cost: 500, driver_cost: 200 },
    ]

    const result = await loadUnpaidOrders(1)
    // Both created_by(10) and vehicle_found_by(20) get entries
    expect(result.size).toBe(2)
    expect(result.get(10)).toHaveLength(1)
    expect(result.get(20)).toHaveLength(1)
  })
})

describe('loadUnpaidSettlements', () => {
  beforeEach(() => {
    mockFromFor('employee_unpaid_settlements')
  })

  it('returns empty map when no data', async () => {
    const result = await loadUnpaidSettlements(1, null)
    expect(result.size).toBe(0)
  })

  it('groups settlements by employee', async () => {
    mockTableData['employee_unpaid_settlements'] = [
      { id: 1, employee: 10, amount: 100, settlement_type: 'bonus', organization: 1 },
      { id: 2, employee: 10, amount: 50, settlement_type: 'fine', organization: 1 },
      { id: 3, employee: 20, amount: 200, settlement_type: 'vacation pay', organization: 1 },
    ]

    const result = await loadUnpaidSettlements(1, null)
    expect(result.size).toBe(2)
    expect(result.get(10)).toHaveLength(2)
    expect(result.get(20)).toHaveLength(1)
  })

  it('filters by userId when provided', async () => {
    mockFromFor('employee_unpaid_settlements')
    mockTableData['employee_unpaid_settlements'] = []

    await loadUnpaidSettlements(1, 10)

    const fromMock = global.supabase.from as Mock
    const query = fromMock.mock.results[0].value as ReturnType<typeof mockQuery>
    expect(query.eq).toHaveBeenCalledWith('employee', 10)
  })
})

describe('calculateEmployeeReport', () => {
  beforeEach(() => {
    mockTableData['employee_payments'] = null
    mockTableData['employee_absences'] = []
    mockTableData['user_conditions'] = []
  })

  it('returns empty array when orgId is null', async () => {
    const result = await calculateEmployeeReport(null, new Map(), new Map(), new Map())
    expect(result).toEqual([])
  })

  it('returns empty array when no employees have data', async () => {
    mockFromFor('employee_payments')
    mockFromFor('employee_absences')
    mockFromFor('user_conditions')

    const result = await calculateEmployeeReport(1, new Map(), new Map(), new Map())
    expect(result).toEqual([])
  })

  it('calculates report for a single employee with orders', async () => {
    mockFromFor('employee_payments')
    mockFromFor('employee_absences')
    mockFromFor('user_conditions')

    const order: any = {
      id: 1,
      cost: 1000,
      driver_cost: 600,
      created_by: 10,
      stage: 2,
      organization: 1,
    }
    const mapping = new Map()
    mapping.set(10, [{ employee: 10, employee_payment: 0, order }])

    const result = await calculateEmployeeReport(1, new Map(), mapping, new Map())
    expect(result).toHaveLength(1)
    expect(result[0].summary.employee).toBe(10)
    expect(result[0].summary.orders_number).toBe(1)
    expect(result[0].summary.orders_amount).toBe(1000)
    expect(result[0].summary.orders_driver).toBe(600)
    expect(result[0].summary.orders_profit).toBe(400)
  })

  it('applies percent_of_gross from payment terms', async () => {
    mockFromFor('employee_payments')
    mockFromFor('employee_absences')
    mockFromFor('user_conditions')

    mockTableData['user_conditions'] = [
      {
        user_id: 10,
        organization: 1,
        percent_of_gross: 10,
        percent_of_profit: 0,
        fixed_salary: 0,
        income_tax: 0,
        created_by: 1,
      },
    ]

    const order: any = {
      id: 1,
      cost: 1000,
      driver_cost: 600,
      created_by: 10,
      stage: 2,
      organization: 1,
    }
    const mapping = new Map()
    mapping.set(10, [{ employee: 10, employee_payment: 0, order }])

    const result = await calculateEmployeeReport(1, new Map(), mapping, new Map())
    expect(result).toHaveLength(1)
    // profit = 1000 - 600 = 400, gross + direct_gross = 1000, toPay = 1000 * 10% = 100
    expect(result[0].summary.toPayment).toBe(100)
    expect(result[0].summary.payout_usd).toBe(100)
  })

  it('splits profit when vehicle_found_by differs from created_by', async () => {
    mockFromFor('employee_payments')
    mockFromFor('employee_absences')
    mockFromFor('user_conditions')

    const order: any = {
      id: 1,
      cost: 1000,
      driver_cost: 600,
      created_by: 10,
      vehicle_found_by: 20,
      percent_vf: 30,
      stage: 2,
      organization: 1,
    }
    const mapping = new Map()
    mapping.set(20, [{ employee: 20, employee_payment: 0, order }])
    // created_by = 10 gets the remaining 70% share via pc = (100 - 30) / 100 = 0.7
    mapping.set(10, [{ employee: 10, employee_payment: 0, order }])

    mockTableData['user_conditions'] = [
      {
        user_id: 10,
        organization: 1,
        percent_of_gross: 0,
        percent_of_profit: 0,
        fixed_salary: 0,
        income_tax: 0,
        created_by: 1,
      },
      {
        user_id: 20,
        organization: 1,
        percent_of_gross: 0,
        percent_of_profit: 0,
        fixed_salary: 0,
        income_tax: 0,
        created_by: 1,
      },
    ]

    const result = await calculateEmployeeReport(1, new Map(), mapping, new Map())
    expect(result).toHaveLength(2)

    const emp10 = result.find((r) => r.summary.employee === 10)!
    const emp20 = result.find((r) => r.summary.employee === 20)!

    // emp20 gets direct: 1000 * 0.3 = 300
    expect(emp20.summary.orders_amount_direct).toBe(300)
    // emp10 gets the rest via pc = (100 - 30) / 100 = 0.7: 1000 * 0.7 = 700
    expect(emp10.summary.orders_amount).toBe(700)
  })

  it('sorts report by payout_usd descending', async () => {
    mockFromFor('employee_payments')
    mockFromFor('employee_absences')
    mockFromFor('user_conditions')

    mockTableData['user_conditions'] = [
      {
        user_id: 10,
        organization: 1,
        percent_of_gross: 10,
        percent_of_profit: 0,
        fixed_salary: 0,
        income_tax: 0,
        created_by: 1,
      },
      {
        user_id: 20,
        organization: 1,
        percent_of_gross: 10,
        percent_of_profit: 0,
        fixed_salary: 0,
        income_tax: 0,
        created_by: 1,
      },
    ]

    const mapping = new Map()
    mapping.set(10, [
      {
        employee: 10,
        employee_payment: 0,
        order: {
          id: 1,
          cost: 500,
          driver_cost: 200,
          created_by: 10,
          stage: 2,
          organization: 1,
        } as any,
      },
    ])
    mapping.set(20, [
      {
        employee: 20,
        employee_payment: 0,
        order: {
          id: 2,
          cost: 2000,
          driver_cost: 1000,
          created_by: 20,
          stage: 2,
          organization: 1,
        } as any,
      },
    ])

    const result = await calculateEmployeeReport(1, new Map(), mapping, new Map())
    expect(result).toHaveLength(2)
    // emp20: gross 2000, 10% = 200 payout
    // emp10: gross 500, 10% = 50 payout
    expect(result[0].summary.employee).toBe(20)
    expect(result[1].summary.employee).toBe(10)
  })
})

describe('calculateWeeklyLeasingCommission', () => {
  beforeEach(() => {
    const from = global.supabase.from as Mock
    from.mockImplementation((t: string) => mockQuery(mockTableData[t] ?? []))
  })

  it('returns empty array when orgId is null', async () => {
    const result = await calculateWeeklyLeasingCommission(null)
    expect(result).toEqual([])
  })

  it('returns empty array when no leasing vehicles', async () => {
    mockTableData['vehicles'] = []

    const result = await calculateWeeklyLeasingCommission(1)
    expect(result).toEqual([])
  })

  it('returns empty array when no stages are ready for payout', async () => {
    mockTableData['vehicles'] = [{ id: 1, unit_id: 'TRK-001', kind: 'cargo van' }]
    mockTableData['vehicle_type'] = [{ id: 5, name: 'cargo van' }]
    mockTableData['vehicle_commission_tiers'] = [
      { vehicle_type_id: 5, gross: 5000, dispatch_fee: 10, dispatcher_commission: 2 },
    ]
    mockTableData['stages'] = []

    const result = await calculateWeeklyLeasingCommission(1)
    expect(result).toEqual([])
  })

  it('calculates commission for a single employee with one vehicle', async () => {
    vi.setSystemTime(new Date('2026-06-01'))

    mockTableData['vehicles'] = [{ id: 10, unit_id: 'TRK-001', kind: 'cargo van' }]
    mockTableData['vehicle_type'] = [{ id: 5, name: 'cargo van' }]
    mockTableData['vehicle_commission_tiers'] = [
      { vehicle_type_id: 5, gross: 5000, dispatch_fee: 10, dispatcher_commission: 2 },
    ]
    mockTableData['stages'] = [{ id: 2, is_ready_for_payout: true }]
    mockTableData['order_events'] = [{ document: 100, vehicle: 10 }]
    mockTableData['orders_journal'] = [
      {
        id: 100,
        number: 1001,
        cost: 3000,
        created_by: 42,
        stage: 2,
        organization: 1,
        excluded: false,
      },
    ]

    const result = await calculateWeeklyLeasingCommission(1)
    expect(result).toHaveLength(1)
    expect(result[0].employee_id).toBe(42)
    expect(result[0].total_commission).toBe(60)
    expect(result[0].details).toHaveLength(1)
    expect(result[0].details[0].total_gross).toBe(3000)
    expect(result[0].details[0].commission_amount).toBe(60)

    vi.useRealTimers()
  })

  it('sums multiple orders per vehicle before applying tier', async () => {
    vi.setSystemTime(new Date('2026-06-01'))

    mockTableData['vehicles'] = [{ id: 10, unit_id: 'TRK-001', kind: 'cargo van' }]
    mockTableData['vehicle_type'] = [{ id: 5, name: 'cargo van' }]
    mockTableData['vehicle_commission_tiers'] = [
      { vehicle_type_id: 5, gross: 5000, dispatch_fee: 10, dispatcher_commission: 2 },
    ]
    mockTableData['stages'] = [{ id: 2, is_ready_for_payout: true }]
    mockTableData['order_events'] = [
      { document: 100, vehicle: 10 },
      { document: 101, vehicle: 10 },
    ]
    mockTableData['orders_journal'] = [
      {
        id: 100,
        number: 1001,
        cost: 2000,
        created_by: 42,
        stage: 2,
        organization: 1,
        excluded: false,
      },
      {
        id: 101,
        number: 1002,
        cost: 3000,
        created_by: 42,
        stage: 2,
        organization: 1,
        excluded: false,
      },
    ]

    const result = await calculateWeeklyLeasingCommission(1)
    expect(result).toHaveLength(1)
    expect(result[0].details[0].total_gross).toBe(5000)
    expect(result[0].details[0].commission_amount).toBe(100)
    expect(result[0].details[0].orders_count).toBe(2)

    vi.useRealTimers()
  })

  it('uses last tier when total_gross exceeds all thresholds', async () => {
    vi.setSystemTime(new Date('2026-06-01'))

    mockTableData['vehicles'] = [{ id: 10, unit_id: 'TRK-001', kind: 'cargo van' }]
    mockTableData['vehicle_type'] = [{ id: 5, name: 'cargo van' }]
    mockTableData['vehicle_commission_tiers'] = [
      { vehicle_type_id: 5, gross: 1000, dispatch_fee: 5, dispatcher_commission: 1 },
      { vehicle_type_id: 5, gross: 5000, dispatch_fee: 10, dispatcher_commission: 2 },
    ]
    mockTableData['stages'] = [{ id: 2, is_ready_for_payout: true }]
    mockTableData['order_events'] = [{ document: 100, vehicle: 10 }]
    mockTableData['orders_journal'] = [
      {
        id: 100,
        number: 1001,
        cost: 10000,
        created_by: 42,
        stage: 2,
        organization: 1,
        excluded: false,
      },
    ]

    const result = await calculateWeeklyLeasingCommission(1)
    expect(result).toHaveLength(1)
    expect(result[0].details[0].commission_amount).toBe(200)

    vi.useRealTimers()
  })

  it('skips vehicle whose kind has no matching vehicle_type entry', async () => {
    vi.setSystemTime(new Date('2026-06-01'))

    mockTableData['vehicles'] = [{ id: 10, unit_id: 'TRK-001', kind: 'unknown type' }]
    mockTableData['vehicle_type'] = [{ id: 5, name: 'cargo van' }]
    mockTableData['stages'] = [{ id: 2, is_ready_for_payout: true }]
    mockTableData['order_events'] = [{ document: 100, vehicle: 10 }]
    mockTableData['orders_journal'] = [
      {
        id: 100,
        number: 1001,
        cost: 3000,
        created_by: 42,
        stage: 2,
        organization: 1,
        excluded: false,
      },
    ]

    const result = await calculateWeeklyLeasingCommission(1)
    expect(result).toHaveLength(0)

    vi.useRealTimers()
  })

  it('groups by employee and returns multiple results sorted by total_commission desc', async () => {
    vi.setSystemTime(new Date('2026-06-01'))

    mockTableData['vehicles'] = [
      { id: 10, unit_id: 'TRK-001', kind: 'cargo van' },
      { id: 20, unit_id: 'TRK-002', kind: 'dry van' },
    ]
    mockTableData['vehicle_type'] = [
      { id: 5, name: 'cargo van' },
      { id: 6, name: 'dry van' },
    ]
    mockTableData['vehicle_commission_tiers'] = [
      { vehicle_type_id: 5, gross: 10000, dispatch_fee: 10, dispatcher_commission: 2 },
      { vehicle_type_id: 6, gross: 10000, dispatch_fee: 10, dispatcher_commission: 3 },
    ]
    mockTableData['stages'] = [{ id: 2, is_ready_for_payout: true }]
    mockTableData['order_events'] = [
      { document: 100, vehicle: 10 },
      { document: 200, vehicle: 20 },
    ]
    mockTableData['orders_journal'] = [
      {
        id: 100,
        number: 1001,
        cost: 5000,
        created_by: 42,
        stage: 2,
        organization: 1,
        excluded: false,
      },
      {
        id: 200,
        number: 2001,
        cost: 8000,
        created_by: 7,
        stage: 2,
        organization: 1,
        excluded: false,
      },
    ]

    const result = await calculateWeeklyLeasingCommission(1)
    expect(result).toHaveLength(2)
    expect(result[0].employee_id).toBe(7)
    expect(result[0].total_commission).toBe(240)
    expect(result[1].employee_id).toBe(42)
    expect(result[1].total_commission).toBe(100)

    vi.useRealTimers()
  })

  it('filters by employeeId when provided', async () => {
    vi.setSystemTime(new Date('2026-06-01'))

    mockTableData['vehicles'] = [{ id: 10, unit_id: 'TRK-001', kind: 'cargo van' }]
    mockTableData['vehicle_type'] = [{ id: 5, name: 'cargo van' }]
    mockTableData['vehicle_commission_tiers'] = [
      { vehicle_type_id: 5, gross: 10000, dispatch_fee: 10, dispatcher_commission: 2 },
    ]
    mockTableData['stages'] = [{ id: 2, is_ready_for_payout: true }]
    mockTableData['order_events'] = [
      { document: 100, vehicle: 10 },
      { document: 101, vehicle: 10 },
    ]
    mockTableData['orders_journal'] = [
      {
        id: 100,
        number: 1001,
        cost: 3000,
        created_by: 42,
        stage: 2,
        organization: 1,
        excluded: false,
      },
      {
        id: 101,
        number: 1002,
        cost: 2000,
        created_by: 7,
        stage: 2,
        organization: 1,
        excluded: false,
      },
    ]

    const result = await calculateWeeklyLeasingCommission(1, 42)
    expect(result).toHaveLength(1)
    expect(result[0].employee_id).toBe(42)

    vi.useRealTimers()
  })
})
