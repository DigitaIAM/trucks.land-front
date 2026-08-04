import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Mock } from 'vitest'

type Row = Record<string, unknown>

function mockQuery(initialData: unknown, status = 200) {
  const data = initialData as Row[]
  const filters: Array<(row: Row) => boolean> = []
  const applyFilters = () => data.filter((row) => filters.every((pred) => pred(row)))
  const q: Record<string, unknown> = {
    select: vi.fn(() => q),
    eq: vi.fn((key: string, val: unknown) => {
      filters.push((row) => row[key] === val)
      return q
    }),
    is: vi.fn((key: string, val: unknown) => {
      filters.push((row) => (val == null ? row[key] == null : row[key] === val))
      return q
    }),
    in: vi.fn((key: string, val: unknown[]) => {
      filters.push((row) => val.includes(row[key]))
      return q
    }),
    gte: vi.fn((key: string, val: unknown) => {
      filters.push((row) => (row[key] as string) >= (val as string))
      return q
    }),
    lte: vi.fn((key: string, val: unknown) => {
      filters.push((row) => (row[key] as number) <= (val as number))
      return q
    }),
    order: vi.fn(() => q),
    limit: vi.fn(() => q),
    maybeSingle: vi.fn(() => q),
    then: vi.fn((resolve: (v: unknown) => void) => {
      resolve({ data: applyFilters(), status, error: null, count: null })
    }),
  }
  return q
}

function mockTables() {
  const from = global.supabase.from as Mock
  from.mockImplementation((t: string) => mockQuery(mockTableData[t] ?? []))
}

const mockTableData: Record<string, unknown> = {}

function mockStorageDownload(impl: (path: string) => { data: Blob | null; error: unknown }) {
  const download = vi.fn(async (path: string) => impl(path))
  global.supabase.storage = {
    from: vi.fn(() => ({ download })),
  }
}

function mockDigest() {
  Object.assign(crypto.subtle, {
    digest: vi.fn(async (_algo: string, data: ArrayBuffer) => {
      const bytes = new Uint8Array(data)
      let hash = 5381
      for (const byte of bytes) {
        hash = ((hash * 33) ^ byte) >>> 0
      }
      const out = new Uint8Array(32)
      new DataView(out.buffer).setUint32(0, hash, true)
      return out.buffer
    }),
  })
}

function pickup(document: number, address: string, city = 'Chicago', zip = '60601') {
  return { document, kind: 'pick-up', address, city, state: 'IL', zip }
}

function delivery(document: number, address: string, city = 'Gary', zip = '46401') {
  return { document, kind: 'delivery', address, city, state: 'IN', zip }
}

function rcFile(document: number, path: string) {
  return { document, kind: 'RC', is_deleted: false, path }
}

function recentOrder(id: number, extra: Record<string, unknown> = {}) {
  return {
    id,
    created_at: new Date().toISOString(),
    ...extra,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  for (const key of Object.keys(mockTableData)) {
    delete mockTableData[key]
  }
  global.supabase.storage = {
    from: vi.fn(() => ({ download: vi.fn(async () => ({ data: new Blob(['rc']), error: null })) })),
  }
  mockDigest()
})

import { loadSimilarLoads, locationKey, groupKey } from '../use-similar-loads'

describe('locationKey / groupKey', () => {
  it('locationKey returns empty string for null event', () => {
    expect(locationKey(null)).toBe('')
  })

  it('locationKey is case and whitespace insensitive', () => {
    const a = { address: '1 Main St', city: '  Chicago ', state: 'IL', zip: '60601' }
    const b = { address: '2 Main St', city: 'chicago', state: 'il', zip: '60601' }
    expect(locationKey(a)).toBe(locationKey(b))
  })

  it('locationKey ignores punctuation in city/state/zip', () => {
    const a = { city: 'Louisville,', state: 'KY', zip: '40219' }
    const b = { city: 'Louisville', state: 'KY ', zip: '40219,' }
    const c = { city: 'Windsor Locks', state: 'CT ', zip: '06096' }
    const d = { city: 'Windsor Locks', state: 'CT', zip: '06096' }
    expect(locationKey(a)).toBe(locationKey(b))
    expect(locationKey(c)).toBe(locationKey(d))
  })

  it('groupKey ignores address and company, matching only city/state/zip', () => {
    const pickup1 = { address: '1 Main St', city: 'Chicago', state: 'IL', zip: '60601' }
    const pickup2 = { address: '2 Main St', city: 'Chicago', state: 'IL', zip: '60601' }
    const delivery1 = { address: '9 State Ave', city: 'Gary', state: 'IN', zip: '46401' }
    const delivery2 = { address: '10 State Ave', city: 'Gary', state: 'IN', zip: '46401' }
    expect(groupKey(10, pickup1, delivery1)).toBe(groupKey(10, pickup2, delivery2))
    expect(groupKey(10, pickup1, delivery1)).not.toBe(groupKey(11, pickup1, delivery1))
    expect(groupKey(10, pickup1, delivery1)).not.toBe(
      groupKey(10, { ...pickup1, city: 'Naperville', zip: '60540' }, delivery1),
    )
  })
})

describe('loadSimilarLoads', () => {
  it('returns empty when there are no orders', async () => {
    mockTables()
    const result = await loadSimilarLoads(7)
    expect(result).toEqual([])
  })

  it('queries orders for the organization within the last four weeks', async () => {
    mockTables()
    mockTableData['orders_journal'] = [recentOrder(1, { broker: 10, organization: 7, year: 2026 })]
    mockTableData['order_files'] = [rcFile(1, '2026/01/01/1/RC_x.pdf')]

    await loadSimilarLoads(7)

    const fromMock = global.supabase.from as Mock
    expect(fromMock).toHaveBeenCalledWith('orders_journal')

    const query = fromMock.mock.results[0].value as ReturnType<typeof mockQuery>
    expect(query.eq).toHaveBeenCalledWith('organization', 7)
    const since = new Date(Date.now() - 4 * 7 * 24 * 60 * 60 * 1000).toISOString()
    const sinceArg = query.gte.mock.calls[0][1] as string
    expect(Math.abs(new Date(since).getTime() - new Date(sinceArg).getTime())).toBeLessThan(5000)
    expect(query.order).toHaveBeenCalledWith('created_at', { ascending: false })
  })

  it('groups similar loads by broker and route, keeping only groups of two or more', async () => {
    mockTables()
    mockTableData['orders_journal'] = [
      recentOrder(1, { broker: 10, number: 101, organization: 7, year: 2026 }),
      recentOrder(2, { broker: 10, number: 102, organization: 7, year: 2026 }),
      recentOrder(3, { broker: 10, number: 103, organization: 7, year: 2026 }),
      recentOrder(4, { broker: 20, number: 104, organization: 7, year: 2026 }),
    ]
    mockTableData['order_events'] = [
      pickup(1, '1 Main St'),
      delivery(1, '9 State Ave'),
      pickup(2, '1 Main St'),
      delivery(2, '9 State Ave'),
      pickup(3, 'Other St', 'Decatur', '62522'),
      delivery(3, 'Other Ave', 'Peoria', '61602'),
    ]
    mockTableData['order_files'] = [
      rcFile(1, '2026/01/01/1/RC_a.pdf'),
      rcFile(2, '2026/01/01/2/RC_b.pdf'),
      rcFile(3, '2026/01/01/3/RC_c.pdf'),
      rcFile(4, '2026/01/01/4/RC_d.pdf'),
    ]

    const result = await loadSimilarLoads(7)

    expect(result).toHaveLength(1)
    expect(result[0].broker).toBe(10)
    expect(result[0].orders.map((order) => order.id).sort()).toEqual([1, 2])
    expect(result[0].orders[0].pickup?.address).toBe('1 Main St')
    expect(result[0].orders[0].delivery?.address).toBe('9 State Ave')
  })

  it('excludes groups whose key is in verifiedKeys', async () => {
    mockTables()
    mockTableData['orders_journal'] = [
      recentOrder(1, { broker: 10, number: 101, organization: 7, year: 2026 }),
      recentOrder(2, { broker: 10, number: 102, organization: 7, year: 2026 }),
      recentOrder(3, { broker: 10, number: 103, organization: 7, year: 2026 }),
      recentOrder(4, { broker: 10, number: 104, organization: 7, year: 2026 }),
    ]
    mockTableData['order_events'] = [
      pickup(1, '1 Main St'),
      delivery(1, '9 State Ave'),
      pickup(2, '1 Main St'),
      delivery(2, '9 State Ave'),
      pickup(3, 'Other St', 'Decatur', '62522'),
      delivery(3, 'Other Ave', 'Peoria', '61602'),
      pickup(4, 'Other St', 'Decatur', '62522'),
      delivery(4, 'Other Ave', 'Peoria', '61602'),
    ]
    mockTableData['order_files'] = [
      rcFile(1, '2026/01/01/1/RC_a.pdf'),
      rcFile(2, '2026/01/01/2/RC_b.pdf'),
      rcFile(3, '2026/01/01/3/RC_c.pdf'),
      rcFile(4, '2026/01/01/4/RC_d.pdf'),
    ]

    const verified = new Set([groupKey(10, pickup(1, '1 Main St'), delivery(1, '9 State Ave'))])
    const result = await loadSimilarLoads(7, verified)

    expect(result).toHaveLength(1)
    expect(result[0].orders.map((order) => order.id).sort()).toEqual([3, 4])
  })

  it('excludes orders without RC files', async () => {
    mockTables()
    mockTableData['orders_journal'] = [
      recentOrder(1, { broker: 10, number: 101, organization: 7, year: 2026 }),
      recentOrder(2, { broker: 10, number: 102, organization: 7, year: 2026 }),
    ]
    mockTableData['order_events'] = [
      pickup(1, '1 Main St'),
      delivery(1, '9 State Ave'),
      pickup(2, '1 Main St'),
      delivery(2, '9 State Ave'),
    ]
    mockTableData['order_files'] = [rcFile(1, '2026/01/01/1/RC_a.pdf')]

    const result = await loadSimilarLoads(7)

    expect(result).toEqual([])
  })

  it('marks rcMatch true when all orders share identical RC files', async () => {
    mockTables()
    mockTableData['orders_journal'] = [
      recentOrder(1, { broker: 10, number: 101, organization: 7, year: 2026 }),
      recentOrder(2, { broker: 10, number: 102, organization: 7, year: 2026 }),
    ]
    mockTableData['order_events'] = [
      pickup(1, '1 Main St'),
      delivery(1, '9 State Ave'),
      pickup(2, '1 Main St'),
      delivery(2, '9 State Ave'),
    ]
    mockTableData['order_files'] = [
      rcFile(1, '2026/01/01/1/RC_a.pdf'),
      rcFile(2, '2026/01/01/2/RC_b.pdf'),
    ]
    mockStorageDownload(() => ({ data: new Blob(['identical content']), error: null }))

    const result = await loadSimilarLoads(7)

    expect(result).toHaveLength(1)
    expect(result[0].rcMatch).toBe(true)
    expect(result[0].orders[0].rcHashes[0]).toBe(result[0].orders[1].rcHashes[0])
  })

  it('marks rcMatch false when RC files differ', async () => {
    mockTables()
    mockTableData['orders_journal'] = [
      recentOrder(1, { broker: 10, number: 101, organization: 7, year: 2026 }),
      recentOrder(2, { broker: 10, number: 102, organization: 7, year: 2026 }),
    ]
    mockTableData['order_events'] = [
      pickup(1, '1 Main St'),
      delivery(1, '9 State Ave'),
      pickup(2, '1 Main St'),
      delivery(2, '9 State Ave'),
    ]
    mockTableData['order_files'] = [
      rcFile(1, '2026/01/01/1/RC_a.pdf'),
      rcFile(2, '2026/01/01/2/RC_b.pdf'),
    ]
    mockStorageDownload((path) => ({ data: new Blob([path]), error: null }))

    const result = await loadSimilarLoads(7)

    expect(result).toHaveLength(1)
    expect(result[0].rcMatch).toBe(false)
  })

  it('uses the latest pickup and delivery event per order', async () => {
    mockTables()
    mockTableData['orders_journal'] = [
      recentOrder(1, { broker: 10, number: 101, organization: 7, year: 2026 }),
      recentOrder(2, { broker: 10, number: 102, organization: 7, year: 2026 }),
    ]
    mockTableData['order_events'] = [
      { ...pickup(1, 'Old St'), datetime: '2026-01-01T08:00:00' },
      { ...pickup(1, 'New St'), datetime: '2026-01-01T10:00:00' },
      delivery(1, '9 State Ave'),
      pickup(2, 'New St'),
      delivery(2, '9 State Ave'),
    ]
    mockTableData['order_files'] = [
      rcFile(1, '2026/01/01/1/RC_a.pdf'),
      rcFile(2, '2026/01/01/2/RC_b.pdf'),
    ]

    const result = await loadSimilarLoads(7)

    expect(result).toHaveLength(1)
    expect(result[0].orders[0].pickup?.address).toBe('New St')
  })

  it('groups similar loads by broker and refs when route events are missing', async () => {
    mockTables()
    mockTableData['orders_journal'] = [
      recentOrder(1, { broker: 10, number: 101, refs: 'L307194', organization: 7, year: 2026 }),
      recentOrder(2, { broker: 10, number: 102, refs: 'L307194', organization: 7, year: 2026 }),
    ]
    mockTableData['order_files'] = [
      rcFile(1, '2026/01/01/1/RC_a.pdf'),
      rcFile(2, '2026/01/01/2/RC_b.pdf'),
    ]

    const result = await loadSimilarLoads(7)

    expect(result).toHaveLength(1)
    expect(result[0].broker).toBe(10)
    expect(result[0].orders.map((order) => order.id).sort()).toEqual([1, 2])
    expect(result[0].orders[0].pickup).toBeNull()
    expect(result[0].orders[0].delivery).toBeNull()
  })

  it('does not group orders sharing only broker when route and refs differ', async () => {
    mockTables()
    mockTableData['orders_journal'] = [
      recentOrder(1, { broker: 10, number: 101, refs: 'REF-A', organization: 7, year: 2026 }),
      recentOrder(2, { broker: 10, number: 102, refs: 'REF-B', organization: 7, year: 2026 }),
    ]
    mockTableData['order_events'] = [
      pickup(1, '1 Main St'),
      delivery(1, '9 State Ave'),
      pickup(2, 'Other St', 'Decatur', '62522'),
      delivery(2, 'Other Ave', 'Peoria', '61602'),
    ]
    mockTableData['order_files'] = [
      rcFile(1, '2026/01/01/1/RC_a.pdf'),
      rcFile(2, '2026/01/01/2/RC_b.pdf'),
    ]

    const result = await loadSimilarLoads(7)

    expect(result).toEqual([])
  })

  it('does not group orders with empty refs and no route data', async () => {
    mockTables()
    mockTableData['orders_journal'] = [
      recentOrder(1, { broker: 10, number: 101, refs: '', organization: 7, year: 2026 }),
      recentOrder(2, { broker: 10, number: 102, refs: null, organization: 7, year: 2026 }),
    ]
    mockTableData['order_files'] = [
      rcFile(1, '2026/01/01/1/RC_a.pdf'),
      rcFile(2, '2026/01/01/2/RC_b.pdf'),
    ]

    const result = await loadSimilarLoads(7)

    expect(result).toEqual([])
  })

  it('merges groups transitively via shared route or refs', async () => {
    mockTables()
    mockTableData['orders_journal'] = [
      recentOrder(1, { broker: 10, number: 101, refs: 'REF-R', organization: 7, year: 2026 }),
      recentOrder(2, { broker: 10, number: 102, refs: 'REF-S', organization: 7, year: 2026 }),
      recentOrder(3, { broker: 10, number: 103, refs: 'REF-R', organization: 7, year: 2026 }),
    ]
    mockTableData['order_events'] = [
      pickup(1, '1 Main St'),
      delivery(1, '9 State Ave'),
      pickup(2, '1 Main St'),
      delivery(2, '9 State Ave'),
      pickup(3, 'Other St'),
      delivery(3, 'Other Ave'),
    ]
    mockTableData['order_files'] = [
      rcFile(1, '2026/01/01/1/RC_a.pdf'),
      rcFile(2, '2026/01/01/2/RC_b.pdf'),
      rcFile(3, '2026/01/01/3/RC_c.pdf'),
    ]

    const result = await loadSimilarLoads(7)

    expect(result).toHaveLength(1)
    expect(result[0].orders.map((order) => order.id).sort()).toEqual([1, 2, 3])
  })

  it('sorts groups by week spread: same week first, then 1, then 2', async () => {
    mockTables()
    mockTableData['orders_journal'] = [
      recentOrder(1, {
        broker: 10,
        number: 101,
        refs: 'A1',
        week: 25,
        organization: 7,
        year: 2026,
      }),
      recentOrder(2, {
        broker: 10,
        number: 102,
        refs: 'A2',
        week: 25,
        organization: 7,
        year: 2026,
      }),
      recentOrder(3, {
        broker: 10,
        number: 103,
        refs: 'B1',
        week: 10,
        organization: 7,
        year: 2026,
      }),
      recentOrder(4, {
        broker: 10,
        number: 104,
        refs: 'B2',
        week: 12,
        organization: 7,
        year: 2026,
      }),
      recentOrder(5, {
        broker: 10,
        number: 105,
        refs: 'C1',
        week: 20,
        organization: 7,
        year: 2026,
      }),
      recentOrder(6, {
        broker: 10,
        number: 106,
        refs: 'C2',
        week: 21,
        organization: 7,
        year: 2026,
      }),
    ]
    mockTableData['order_events'] = [
      pickup(1, 'a', 'CityA', '10001'),
      delivery(1, 'a', 'TownA', '20001'),
      pickup(2, 'a', 'CityA', '10001'),
      delivery(2, 'a', 'TownA', '20001'),
      pickup(3, 'a', 'CityB', '10002'),
      delivery(3, 'a', 'TownB', '20002'),
      pickup(4, 'a', 'CityB', '10002'),
      delivery(4, 'a', 'TownB', '20002'),
      pickup(5, 'a', 'CityC', '10003'),
      delivery(5, 'a', 'TownC', '20003'),
      pickup(6, 'a', 'CityC', '10003'),
      delivery(6, 'a', 'TownC', '20003'),
    ]
    mockTableData['order_files'] = [
      rcFile(1, '2026/01/01/1/RC_a.pdf'),
      rcFile(2, '2026/01/01/2/RC_b.pdf'),
      rcFile(3, '2026/01/01/3/RC_c.pdf'),
      rcFile(4, '2026/01/01/4/RC_d.pdf'),
      rcFile(5, '2026/01/01/5/RC_e.pdf'),
      rcFile(6, '2026/01/01/6/RC_f.pdf'),
    ]

    const result = await loadSimilarLoads(7)

    expect(result.map((group) => group.orders.map((order) => order.id).sort())).toEqual([
      [1, 2],
      [5, 6],
      [3, 4],
    ])
  })
})
