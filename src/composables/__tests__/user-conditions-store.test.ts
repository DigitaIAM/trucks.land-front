import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { Mock } from 'vitest'
import { useUserConditionsStore } from '@/stores/user_conditions'

function mockQuery(data: unknown, status = 200, error: unknown = null) {
  const response = { data, status, error, count: null }
  const q = {
    select: vi.fn(() => q),
    eq: vi.fn(() => q),
    is: vi.fn(() => q),
    gte: vi.fn(() => q),
    lte: vi.fn(() => q),
    order: vi.fn(() => q),
    limit: vi.fn(() => q),
    maybeSingle: vi.fn(() => q),
    update: vi.fn(() => q),
    insert: vi.fn(() => q),
    single: vi.fn(() => q),
    then: vi.fn((resolve: (v: typeof response) => void) => resolve(response)),
  }
  return q
}

function mockConditionTable(readData: unknown) {
  const readResponse = { data: readData, status: 200, error: null, count: null }
  const readQ = {
    select: vi.fn(() => readQ),
    eq: vi.fn(() => readQ),
    order: vi.fn(() => readQ),
    limit: vi.fn(() => readQ),
    then: vi.fn((resolve: (v: typeof readResponse) => void) => resolve(readResponse)),
  }

  const writeResponse = { data: { id: 9 }, status: 201, error: null, count: null }
  const writeQ = {
    update: vi.fn(() => writeQ),
    insert: vi.fn(() => writeQ),
    select: vi.fn(() => writeQ),
    eq: vi.fn(() => writeQ),
    single: vi.fn(() => writeQ),
    then: vi.fn((resolve: (v: typeof writeResponse) => void) => resolve(writeResponse)),
  }

  const table = {
    ...readQ,
    update: writeQ.update,
    insert: writeQ.insert,
  }

  return { table, updateQ: writeQ, insertQ: writeQ }
}

const existingRow = {
  id: 5,
  organization: 1,
  user_id: 42,
  created_by: 1,
  percent_of_gross: 10,
  percent_of_profit: 0,
  fixed_salary: 0,
  income_tax: 13,
}

const params = {
  percent_of_gross: 10,
  percent_of_profit: 0,
  fixed_salary: 0,
  income_tax: 13,
}

describe('useUserConditionsStore.save', () => {
  const from = global.supabase.from as Mock

  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  it('inserts a new condition row with created_by when none exists', async () => {
    const { table, insertQ } = mockConditionTable([])

    from.mockImplementation((t: string) => (t === 'user_conditions' ? table : mockQuery([])))

    const store = useUserConditionsStore()
    const id = await store.save(1, 42, params, 7)

    expect(id).toBe(9)
    expect(insertQ.insert).toHaveBeenCalledWith({
      organization: 1,
      user_id: 42,
      ...params,
      created_by: 7,
    })
    expect(insertQ.update).not.toHaveBeenCalled()
  })

  it('updates the existing row by id when salary and profit are unchanged', async () => {
    const { table, updateQ } = mockConditionTable([existingRow])

    from.mockImplementation((t: string) => (t === 'user_conditions' ? table : mockQuery([])))

    const store = useUserConditionsStore()
    const id = await store.save(1, 42, params, 7)

    expect(id).toBe(5)
    expect(updateQ.update).toHaveBeenCalledWith(params)
    expect(updateQ.insert).not.toHaveBeenCalled()
  })

  it('inserts a new row instead of updating when fixed_salary changed', async () => {
    const { table, insertQ, updateQ } = mockConditionTable([existingRow])

    from.mockImplementation((t: string) => (t === 'user_conditions' ? table : mockQuery([])))

    const store = useUserConditionsStore()
    const id = await store.save(1, 42, { ...params, fixed_salary: 700 }, 7)

    expect(id).toBe(9)
    expect(insertQ.insert).toHaveBeenCalledWith({
      organization: 1,
      user_id: 42,
      ...params,
      fixed_salary: 700,
      created_by: 7,
    })
    expect(updateQ.update).not.toHaveBeenCalled()
  })

  it('inserts a new row instead of updating when percent_of_profit changed', async () => {
    const { table, insertQ, updateQ } = mockConditionTable([existingRow])

    from.mockImplementation((t: string) => (t === 'user_conditions' ? table : mockQuery([])))

    const store = useUserConditionsStore()
    const id = await store.save(1, 42, { ...params, percent_of_profit: 5 }, 7)

    expect(id).toBe(9)
    expect(insertQ.insert).toHaveBeenCalledWith({
      organization: 1,
      user_id: 42,
      ...params,
      percent_of_profit: 5,
      created_by: 7,
    })
    expect(updateQ.update).not.toHaveBeenCalled()
  })

  it('inserts a new row instead of updating when income_tax changed', async () => {
    const { table, insertQ, updateQ } = mockConditionTable([existingRow])

    from.mockImplementation((t: string) => (t === 'user_conditions' ? table : mockQuery([])))

    const store = useUserConditionsStore()
    const id = await store.save(1, 42, { ...params, income_tax: 20 }, 7)

    expect(id).toBe(9)
    expect(insertQ.insert).toHaveBeenCalledWith({
      organization: 1,
      user_id: 42,
      ...params,
      income_tax: 20,
      created_by: 7,
    })
    expect(updateQ.update).not.toHaveBeenCalled()
  })

  it('throws when insert fails', async () => {
    const readResponse = { data: [], status: 200, error: null, count: null }
    const readQ = {
      select: vi.fn(() => readQ),
      eq: vi.fn(() => readQ),
      order: vi.fn(() => readQ),
      limit: vi.fn(() => readQ),
      then: vi.fn((resolve: (v: typeof readResponse) => void) => resolve(readResponse)),
    }

    const writeResponse = {
      data: null,
      status: 403,
      error: { message: 'row-level security violated' },
      count: null,
    }
    const writeQ = {
      insert: vi.fn(() => writeQ),
      select: vi.fn(() => writeQ),
      eq: vi.fn(() => writeQ),
      single: vi.fn(() => writeQ),
      then: vi.fn((resolve: (v: typeof writeResponse) => void) => resolve(writeResponse)),
    }

    const table = { ...readQ, insert: writeQ.insert }

    from.mockImplementation((t: string) => (t === 'user_conditions' ? table : mockQuery([])))

    const store = useUserConditionsStore()
    await expect(store.save(1, 42, params, 7)).rejects.toThrow('row-level security violated')
  })
})
