import { vi } from 'vitest'
import { ref, computed } from 'vue'
import { computedAsync } from '@vueuse/core'
import type { supabase as supabaseClient } from './src/composables/use-supabase'

const testGlobals = globalThis as unknown as {
  ref: typeof ref
  computed: typeof computed
  computedAsync: typeof computedAsync
}
testGlobals.ref = ref
testGlobals.computed = computed
testGlobals.computedAsync = computedAsync

function createMockQuery(data: unknown, status = 200) {
  const response = { data, status, error: null, count: null }
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    is: vi.fn(() => query),
    gte: vi.fn(() => query),
    lte: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(() => query),
    insert: vi.fn(() => query),
    update: vi.fn(() => query),
    delete: vi.fn(() => query),
    single: vi.fn(() => query),
    maybeSingle: vi.fn(() => query),
    then: vi.fn((resolve: (v: typeof response) => void) => {
      resolve(response)
    }),
  }
  return query
}

const mockFrom = vi.fn(() => createMockQuery([]))

global.supabase = {
  from: mockFrom,
  channel: vi.fn(() => ({
    on: vi.fn(() => ({ subscribe: vi.fn() })),
  })),
  auth: {
    signUp: vi.fn(async () => ({ data: { user: { id: 'auth-uuid' } }, error: null })),
  },
} as unknown as typeof supabaseClient

global.useUsersStore = vi.fn(() => ({
  resolve: vi.fn(async (id: number) => ({ id, real_name: 'User ' + id, name: 'user' + id, access: {} })),
}))

global.useOwnersStore = vi.fn(() => ({
  resolve: vi.fn(async (id: number) => ({ id, name: 'Owner ' + id })),
}))
