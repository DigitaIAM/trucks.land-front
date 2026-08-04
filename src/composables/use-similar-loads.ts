import { groupBy } from '@/utils/group-by.ts'
import type { Order } from '@/stores/orders.ts'
import type { OrderEvent } from '@/stores/order_events.ts'
import type { FileRecord } from '@/stores/order_files.ts'

export interface SimilarLoadOrder extends Order {
  week?: number
  year?: number
  pickup: OrderEvent | null
  delivery: OrderEvent | null
  rcHashes: string[]
}

export interface SimilarLoadGroup {
  broker: number
  pickup: OrderEvent | null
  delivery: OrderEvent | null
  orders: SimilarLoadOrder[]
  rcMatch: boolean
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

async function fetchInChunks(table: string, ids: number[], filters: Record<string, unknown> = {}) {
  const chunks = chunkArray(ids, 50)
  const results = await Promise.all(
    chunks.map(async (chunk) => {
      let query = supabase.from(table).select().in('document', chunk)
      Object.entries(filters).forEach(([key, val]) => {
        query = query.eq(key, val)
      })
      const res = await query
      return (res.data ?? []) as unknown[]
    }),
  )
  return results.flat()
}

function latestByDocument(list: unknown[]): Map<number, OrderEvent> {
  const map = new Map<number, OrderEvent>()
  for (const record of list) {
    const event = record as OrderEvent
    const current = map.get(event.document)
    if (!current || event.datetime > current.datetime) {
      map.set(event.document, event)
    }
  }
  return map
}

function normalizeLocation(part: string | undefined | null): string {
  return (part ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
}

function normalizeRefs(refs: string | null | undefined): string {
  return (refs ?? '').trim().toLowerCase()
}

export function locationKey(event: OrderEvent | null): string {
  if (!event) {
    return ''
  }
  return [event.city, event.state, event.zip].map(normalizeLocation).join('|')
}

export function groupKey(
  broker: number,
  pickup: OrderEvent | null,
  delivery: OrderEvent | null,
): string {
  return broker + '|' + locationKey(pickup) + '|' + locationKey(delivery)
}

export async function sha256(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function rcHashesForOrder(files: FileRecord[]): Promise<string[]> {
  const hashes = await Promise.all(
    files.map(async (file) => {
      try {
        const { data, error } = await supabase.storage.from('orders').download(file.path)
        if (error || data == null) {
          return ''
        }
        return await sha256(data)
      } catch {
        return ''
      }
    }),
  )
  return hashes.filter((hash) => hash.length > 0)
}

function intersect(list: string[][]): Set<string> {
  if (list.length === 0) {
    return new Set()
  }
  const result = new Set(list[0])
  for (const current of list.slice(1)) {
    const next = new Set(current)
    for (const value of [...result]) {
      if (!next.has(value)) {
        result.delete(value)
      }
    }
  }
  return result
}

function weekSpread(orders: SimilarLoadOrder[]): number {
  const weeks = orders
    .map((order) => order.week)
    .filter((week): week is number => typeof week === 'number' && Number.isFinite(week))
  if (weeks.length === 0) {
    return 0
  }
  return Math.max(...weeks) - Math.min(...weeks)
}

export async function loadSimilarLoads(
  orgId: number,
  verifiedKeys: Set<string> = new Set(),
): Promise<SimilarLoadGroup[]> {
  const fourWeeksAgo = new Date(Date.now() - 4 * 7 * 24 * 60 * 60 * 1000).toISOString()

  const response = await supabase
    .from('orders_journal')
    .select()
    .eq('organization', orgId)
    .gte('created_at', fourWeeksAgo)
    .order('created_at', { ascending: false })

  if (response.status != 200) {
    throw 'unexpended response status: ' + response.status
  }

  const orders = (response.data ?? []) as Order[]

  if (orders.length === 0) {
    return []
  }

  const ids = orders.map((order) => order.id)

  const [pickups, deliveries, files] = await Promise.all([
    fetchInChunks('order_events', ids, { kind: 'pick-up' }),
    fetchInChunks('order_events', ids, { kind: 'delivery' }),
    fetchInChunks('order_files', ids, { kind: 'RC', is_deleted: false }),
  ])

  const pickupsMap = latestByDocument(pickups)
  const deliveriesMap = latestByDocument(deliveries)
  const rcByOrder = groupBy(files as FileRecord[], (file) => file.document)

  const withRoute = orders
    .filter((order) => rcByOrder.has(order.id))
    .map((order) => ({
      ...order,
      pickup: pickupsMap.get(order.id) ?? null,
      delivery: deliveriesMap.get(order.id) ?? null,
      rcHashes: [] as string[],
    }))

  const parent = new Map(withRoute.map((order) => [order.id, order.id]))

  function find(id: number): number {
    let root = parent.get(id) as number
    while (root !== id) {
      id = root
      root = parent.get(id) as number
    }
    return id
  }

  function union(a: number, b: number) {
    const ra = find(a)
    const rb = find(b)
    if (ra !== rb) {
      parent.set(ra, rb)
    }
  }

  const routeBuckets = new Map<string, number[]>()
  const refsBuckets = new Map<string, number[]>()

  function pushBucket(map: Map<string, number[]>, key: string, id: number) {
    const bucket = map.get(key) ?? []
    bucket.push(id)
    map.set(key, bucket)
  }

  for (const order of withRoute) {
    if (order.pickup || order.delivery) {
      pushBucket(routeBuckets, groupKey(order.broker, order.pickup, order.delivery), order.id)
    }
    const refs = normalizeRefs(order.refs)
    if (refs) {
      pushBucket(refsBuckets, order.broker + '|' + refs, order.id)
    }
  }

  for (const bucket of [...routeBuckets.values(), ...refsBuckets.values()]) {
    for (let i = 1; i < bucket.length; i++) {
      union(bucket[0], bucket[i])
    }
  }

  const components = new Map<number, SimilarLoadOrder[]>()
  for (const order of withRoute) {
    const root = find(order.id)
    const list = components.get(root)
    if (list) {
      list.push(order)
    } else {
      components.set(root, [order])
    }
  }

  const candidates = [...components.values()].filter(
    (list) =>
      list.length >= 2 &&
      !verifiedKeys.has(groupKey(list[0].broker, list[0].pickup, list[0].delivery)),
  )
  candidates.sort((a, b) => weekSpread(a) - weekSpread(b))
  await Promise.all(
    candidates.flat().map(async (order) => {
      const files = rcByOrder.get(order.id) ?? []
      order.rcHashes = await rcHashesForOrder(files)
    }),
  )

  return candidates.map((list) => {
    const first = list[0]
    return {
      broker: first.broker,
      pickup: first.pickup,
      delivery: first.delivery,
      orders: list,
      rcMatch: intersect(list.map((order) => order.rcHashes)).size > 0,
    }
  })
}
