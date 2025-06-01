import { acceptHMRUpdate, defineStore } from 'pinia'
import { useInitializeStore } from '@/composables/use-initialize-store.ts'

export interface User extends UserCreate {
  id: number
  created_at: string
}

export interface UserCreate {
  name: string
  real_name: string

  phone: string
  email: string

  group: string
  // password: string
  organization?: number

  less_ten: number
  more_ten: number
  percent: number

  admin: boolean
  manager: boolean
  dispatcher_supervisor: boolean
  dispatcher: boolean
  tracking_supervisor: boolean
  tracking_team: boolean
  accounts: boolean
  hr: boolean
  broker: boolean
  view: boolean
  driver: boolean

  disabled: boolean
}

export interface UserUpdate {
  name?: string
  real_name?: string

  phone?: string
  email?: string

  group?: string
  // password?: string

  organization?: number

  less_ten?: number
  more_ten?: number
  percent?: number

  admin?: boolean
  manager?: boolean
  dispatcher_supervisor?: boolean
  dispatcher?: boolean
  tracking_supervisor?: boolean
  tracking_team?: boolean
  accounts?: boolean
  hr?: boolean
  broker?: boolean
  view?: boolean
  driver?: boolean

  disabled?: boolean
}

export const useUsersStore = defineStore('user', () => {
  const mapping = ref(new Map<number, User>())

  const { initialized, loading } = useInitializeStore(async () => {
    const response = await supabase.from('users').select()

    const map = new Map<number, User>()
    response.data?.forEach((json) => {
      const user = json as User
      map.set(user.id, user)
    })

    mapping.value = map
  })

  const listing = computed(() => {
    const list = [] as User[]

    mapping.value.forEach((v) => {
      list.push(v)
    })

    return list
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

  return { initialized, loading, listing, create, update }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUsersStore, import.meta.hot))
}
