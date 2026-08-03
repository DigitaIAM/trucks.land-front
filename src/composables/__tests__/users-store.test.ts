import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { Mock } from 'vitest'
import { useUsersStore } from '@/stores/users'

function mockRead(data: unknown, status = 200) {
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
    then: vi.fn((resolve: (v: typeof response) => void) => resolve(response)),
  }
  return q
}

function mockWrite(data: unknown, status = 201, error: unknown = null) {
  const response = { data, status, error, count: null }
  const q = {
    insert: vi.fn(() => q),
    select: vi.fn(() => q),
    eq: vi.fn(() => q),
    single: vi.fn(() => q),
    delete: vi.fn(() => q),
    then: vi.fn((resolve: (v: typeof response) => void) => resolve(response)),
  }
  return q
}

function mockUsersTable(createdUser: unknown) {
  const readResponse = { data: [], status: 200, error: null, count: null }
  const readQ = {
    select: vi.fn(() => readQ),
    eq: vi.fn(() => readQ),
    limit: vi.fn(() => readQ),
    maybeSingle: vi.fn(() => readQ),
    then: vi.fn((resolve: (v: typeof readResponse) => void) => resolve(readResponse)),
  }

  const insertResponse = { data: createdUser, status: 201, error: null, count: null }
  const insertQ = {
    insert: vi.fn(() => insertQ),
    select: vi.fn(() => insertQ),
    eq: vi.fn(() => insertQ),
    single: vi.fn(() => insertQ),
    then: vi.fn((resolve: (v: typeof insertResponse) => void) => resolve(insertResponse)),
  }

  const table = {
    ...readQ,
    insert: vi.fn(() => insertQ),
  }

  table.delete = vi.fn(() => table)
  table.eq = vi.fn(() => table)

  return table
}

const params = {
  orgId: 1,
  performedBy: 7,
  email: 'ivan@example.com',
  password: 'secret',
  name: 'ivan',
  real_name: 'Ivan Petrov',
  phone: '123',
  team: '2',
  access: {
    is_admin: false,
    is_dispatcher: true,
    is_tracking: false,
    is_hr: false,
    is_accountant: false,
    is_payroll_accountant: false,
  },
}

describe('useUsersStore.register', () => {
  const from = global.supabase.from as Mock
  const signUp = global.supabase.auth.signUp as Mock
  const setSession = global.supabase.auth.setSession as Mock
  const tables: Record<string, ReturnType<typeof mockUsersTable> | ReturnType<typeof mockWrite>> = {}

  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())

    from.mockImplementation((t: string) => {
      if (t === 'users') {
        tables.users = mockUsersTable({ id: 42, uid: 'auth-uuid', ...params })
        return tables.users
      }
      if (t === 'access_matrix') {
        tables.access_matrix = mockWrite({})
        return tables.access_matrix
      }
      return mockRead([])
    })
  })

  it('creates an auth user, a users row and an access matrix record', async () => {
    const store = useUsersStore()
    const user = await store.register(params)

    expect(user.id).toBe(42)

    expect(signUp).toHaveBeenCalledWith({
      email: 'ivan@example.com',
      password: 'secret',
      options: {
        data: { name: 'ivan', real_name: 'Ivan Petrov', phone: '123' },
      },
    })

    expect(setSession).toHaveBeenCalledWith({
      access_token: 'admin-token',
      refresh_token: 'admin-refresh',
    })

    expect(tables.users.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        uid: 'auth-uuid',
        email: 'ivan@example.com',
        team: 2,
        fired: false,
      }),
    )

    expect(tables.access_matrix.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization: 1,
        user_uuid: 'auth-uuid',
        user_id: 42,
        is_dispatcher: true,
        is_admin: false,
        team: 2,
        created_by: 7,
      }),
    )
  })

  it('throws when signUp fails and does not insert a users row', async () => {
    signUp.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'User already registered' },
    })

    const store = useUsersStore()
    await expect(store.register(params)).rejects.toThrow('User already registered')

    expect(tables.users.insert).not.toHaveBeenCalled()
    expect(tables.access_matrix.insert).not.toHaveBeenCalled()
  })

  it('removes the users row when access matrix insert fails', async () => {
    tables.access_matrix = mockWrite({}, 403, { message: 'row-level security violated' })
    from.mockImplementation((t: string) => {
      if (t === 'users') {
        tables.users = mockUsersTable({ id: 42, uid: 'auth-uuid', ...params })
        return tables.users
      }
      if (t === 'access_matrix') {
        return tables.access_matrix
      }
      return mockRead([])
    })

    const store = useUsersStore()
    await expect(store.register(params)).rejects.toThrow('row-level security violated')

    expect(tables.users.delete).toHaveBeenCalled()
  })
})
