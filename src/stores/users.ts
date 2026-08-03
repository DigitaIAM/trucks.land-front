import { acceptHMRUpdate, defineStore } from 'pinia'
import { useInitializeStore } from '@/composables/use-initialize-store.ts'
import { sleep } from '@/utils/datetime.ts'

export interface User extends UserCreate {
  id: number
  created_at: string
  access: AccessMatrix
}

export interface UserCreate {
  uid: string
  name: string
  real_name: string
  phone: string
  email: string
  team: string
  fired: boolean
  fired_at: Date
  performed_by?: number
}

export interface UserUpdate {
  name?: string
  real_name?: string
  phone?: string
  email?: string
  team?: string
  fired?: boolean
  fired_at?: Date
  performed_by?: number
}

export const useUsersStore = defineStore('user', () => {
  const mapping = ref(new Map<number, User | Promise<User>>())
  const uuids = ref(new Map<number, Map<string, User>>())

  const searchResult = ref<Array<User> | null>(null)

  const { initialized, loading } = useInitializeStore(async () => {
    const response = await supabase.from('users').select()

    const map = new Map<number, User>()
    response.data?.forEach((json) => {
      const user = json as User
      map.set(user.id, user)
    })

    mapping.value = map
  })

  const listing = computedAsync(async () => {
    if (searchResult.value == null) {
      const list = [] as User[]

      for (const obj of mapping.value.values()) {
        list.push(await obj)
      }

      return list
    } else {
      return searchResult.value
    }
  })

  async function create(userData: UserCreate) {
    try {
      const { data, error } = await supabase.from('users').insert(userData).select().single()

      if (error) throw error

      if (data) {
        const newUser = data as User
        mapping.value.set(newUser.id, newUser)
        return newUser
      }
    } catch (error) {
      console.error('Ошибка при создании пользователя:', error)
      throw error
    }
  }

  async function register(params: {
    orgId: number
    performedBy?: number
    email: string
    password: string
    name: string
    real_name: string
    phone: string
    team: string
    access: {
      is_admin: boolean
      is_dispatcher: boolean
      is_tracking: boolean
      is_hr: boolean
      is_accountant: boolean
      is_payroll_accountant: boolean
    }
  }) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          name: params.name,
          real_name: params.real_name,
          phone: params.phone,
        },
      },
    })

    if (authError) throw authError
    if (!authData?.user) throw new Error('Не удалось создать аккаунт пользователя')

    const { data, error } = await supabase
      .from('users')
      .insert({
        uid: authData.user.id,
        name: params.name,
        real_name: params.real_name,
        phone: params.phone,
        email: params.email,
        team: params.team,
        fired: false,
      } as UserCreate)
      .select()
      .single()

    if (error) throw error

    const newUser = data as User

    try {
      const { error: accessError } = await supabase.from('access_matrix').insert({
        organization: params.orgId,
        user_uuid: authData.user.id,
        user_id: newUser.id,
        is_admin: params.access.is_admin,
        is_dispatcher: params.access.is_dispatcher,
        is_tracking: params.access.is_tracking,
        is_hr: params.access.is_hr,
        is_accountant: params.access.is_accountant,
        is_payroll_accountant: params.access.is_payroll_accountant,
        team: params.team ? Number(params.team) : null,
        created_by: params.performedBy,
      } as AccessMatrixCreate)

      if (accessError) throw accessError
    } catch (error) {
      await supabase.from('users').delete().eq('id', newUser.id)
      console.error('Ошибка при назначении ролей пользователю:', error)
      throw error
    }

    mapping.value.set(newUser.id, newUser)
    return newUser
  }

  async function update(
    id: number | undefined,
    userData: {
      fired: boolean
      fired_at: string | null
    },
  ) {
    if (!id) {
      throw new Error('ID пользователя не определен')
    }

    try {
      const { data, error, status } = await supabase
        .from('users')
        .update(userData)
        .eq('id', id)
        .select()

      if (error) throw error

      if (status === 200 && data) {
        data.forEach((json) => {
          const updatedUser = json as User
          mapping.value.set(updatedUser.id, updatedUser)
        })
      }

      return data
    } catch (error) {
      console.error('Ошибка при обновлении пользователя в БД:', error)
      throw error
    }
  }

  async function _fetching(id: number): Promise<User> {
    const response = await supabase.from('users').select().eq('id', id)

    if (response.data && response.data.length > 0) {
      return response.data[0] as User
    }
    return { id: id, name: 'error loading' } as User
  }

  async function resolve(id: number | null): Promise<User | null> {
    if (!id || id < 0) return null

    while (loading.value) {
      await sleep(10)
    }

    const v = mapping.value.get(id)
    if (v) {
      return v
    }

    const promise = _fetching(id)

    mapping.value.set(id, promise)

    return promise
  }

  async function resolveUUID(oid: number | null, uuid: string | null): Promise<User | null> {
    if (oid && uuid) {
      const v = uuids.value.get(oid)?.get(uuid)
      if (v) {
        return v
      }

      const responseAccess = await supabase
        .from('access_matrix')
        .select()
        .eq('organization', oid)
        .eq('user_uuid', uuid)
        .maybeSingle()

      if (responseAccess.data) {
        const access = responseAccess.data as AccessMatrix

        const response = await supabase.from('users').select().eq('id', access.user_id)

        response.data?.forEach((json) => {
          const user = json as User
          user.access = access

          const map = uuids.value.get(oid) || new Map()
          map.set(uuid, user)

          uuids.value.set(oid, map)
        })
      }
      return uuids.value.get(oid)?.get(uuid) || null
    } else {
      return null
    }
  }

  async function search(text: string, key?: string): Promise<Array<User>> {
    const response = await supabase
      .from('users')
      .select()
      .ilike(key ?? 'name', '%' + text + '%')
      .limit(10)

    if (response.status == 200) {
      return response.data?.map((json) => json as User) ?? []
    }

    return []
  }

  async function searchAndListing(text: string | null) {
    if (text) {
      searchResult.value = await search(text)
    } else {
      searchResult.value = null
    }
  }

  return {
    initialized,
    loading,
    listing,
    create,
    register,
    update,
    resolve,
    resolveUUID,
    search,
    searchAndListing,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUsersStore, import.meta.hot))
}
