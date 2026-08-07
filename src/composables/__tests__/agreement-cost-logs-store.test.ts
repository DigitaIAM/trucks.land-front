import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Mock } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAgreementCostLogsStore } from '../../stores/agreement_cost_logs'

function mockQuery(data: unknown, status = 200) {
  const response = { data, status, error: null, count: null }
  const q = {
    select: vi.fn(() => q),
    eq: vi.fn(() => q),
    is: vi.fn(() => q),
    order: vi.fn(() => q),
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
  setActivePinia(createPinia())
})

describe('useAgreementCostLogsStore', () => {
  it('returns empty list when no data', async () => {
    mockFromFor('agreement_cost_log')
    const store = useAgreementCostLogsStore()

    const result = await store.fetching(1)

    expect(result).toEqual([])
    expect(store.listing).toEqual([])
  })

  it('fetches logs for the organization and populates listing', async () => {
    mockFromFor('agreement_cost_log')
    mockTableData['agreement_cost_log'] = [
      {
        id: 1,
        organization: 1,
        document: 10,
        event_id: 5,
        old_cost: 100,
        new_cost: 150,
        created_by: 2,
        created_at: '2026-08-01T12:00:00Z',
      },
      {
        id: 2,
        organization: 1,
        document: 11,
        event_id: 6,
        old_cost: 200,
        new_cost: null,
        created_by: 3,
        created_at: '2026-08-02T12:00:00Z',
      },
    ]

    const store = useAgreementCostLogsStore()
    const result = await store.fetching(1)

    const from = global.supabase.from as Mock
    expect(from).toHaveBeenCalledWith('agreement_cost_log')
    expect(result).toHaveLength(2)
    expect(result[0].document).toBe(10)
    expect(result[0].old_cost).toBe(100)
    expect(result[0].new_cost).toBe(150)
    expect(result[1].new_cost).toBeNull()
    expect(store.listing).toHaveLength(2)
  })

  it('throws on unexpected response status', async () => {
    const from = global.supabase.from as Mock
    from.mockImplementation(() => mockQuery([], 500))
    const store = useAgreementCostLogsStore()

    await expect(store.fetching(1)).rejects.toThrow()
  })
})
