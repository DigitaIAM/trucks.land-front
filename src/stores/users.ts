import { acceptHMRUpdate, defineStore } from 'pinia'
import { useInitializeStore } from '@/composables/use-initialize-store.ts'
import { sleep } from '@/utils/datetime.ts'

export interface User extends UserCreate {
  id: number
  created_at: string
}

export interface UserCreate {
  name: string
  real_name: string
  phone: string
  email: string
}

export interface UserUpdate {
  name?: string
  real_name?: string
  phone?: string
  email?: string
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

  function create(user: UserCreate) {
    supabase
      .from('users')
      .insert(user)
      .select()
      .then((response) => {
        console.log('response', response)
        if (response.status == 201) {
          response.data?.forEach((json) => {
            const user = json as User
            mapping.value.set(user.id, user)
          })
        }
      })
  }

  function update(id: number, user: UserUpdate) {
    supabase
      .from('users')
      .update(user)
      .eq('id', id)
      .select()
      .then((response) => {
        if (response.status == 200) {
          response.data?.forEach((json) => {
            const user = json as User
            mapping.value.set(user.id, user)
          })
        }
      })
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
    if (v) return v

    const promise = _fetching(id)
    mapping.value.set(id, promise)

    return promise
  }

  async function resolveUUID(oid: number | null, uuid: string | null) {
    if (oid && uuid) {
      const v = uuids.value.get(oid)?.get(uuid)
      if (v) {
        return v
      }

      const access = await supabase
        .from('access_matrix')
        .select()
        .eq('organization', oid)
        .eq('uuid', uuid)

      if (access.data) {
        const response = await supabase.from('users').select().eq('id', access.data[0].user_id)

        response.data?.forEach((json) => {
          const user = json as User

          const map = uuids.value.get(oid) || new Map()
          map.set(uuid, user)

          uuids.value.set(oid, map)
        })
      }
      return uuids.value.get(oid)?.get(uuid)
    } else {
      return null
    }
  }

  async function search(text: string) {
    const response = await supabase
      .from('users')
      .select()
      .ilike('name', '%' + text + '%')
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
