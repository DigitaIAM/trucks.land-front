import { acceptHMRUpdate, defineStore } from 'pinia'
import { useInitializeStore } from '@/composables/use-initialize-store.ts'
import type { Broker } from '@/stores/brokers.ts'

export interface Owner extends OwnerCreate {
  id: number
  created_at: string
}

export interface OwnerCreate {
  is_active: boolean
  is_person: boolean
  name: string
  ein: string
  email: string
  phone: string
  street: string
  city: string
  state: string
  zip: string
}

export interface OwnerUpdate {
  is_active?: boolean
  is_person?: boolean
  name?: string
  ein?: string
  email?: string
  phone?: string
  street?: string
  city?: string
  state?: string
  zip?: string
}

export const useOwnersStore = defineStore('owner', () => {
  const mapping = ref(new Map<number, Owner>())

  const { initialized, loading } = useInitializeStore(async () => {
    const response = await supabase.from('owners').select()

    const map = new Map<number, Owner>()
    response.data?.forEach((json) => {
      const owner = json as Owner
      map.set(owner.id, owner)
    })

    mapping.value = map
  })

  const listing = computed(() => {
    const list = [] as Owner[]

    mapping.value.forEach((v) => {
      list.push(v)
    })

    return list
  })

  function create(owner: OwnerCreate) {
    supabase
      .from('owners')
      .insert(owner)
      .select()
      .then((response) => {
        console.log('response', response)
        if (response.status == 201) {
          response.data?.forEach((json) => {
            const owner = json as Owner
            mapping.value.set(owner.id, owner)
          })
        }
      })
  }

  function update(id: number, owner: OwnerUpdate) {
    supabase
      .from('owners')
      .update(owner)
      .eq('id', id)
      .select()
      .then((response) => {
        if (response.status == 200) {
          response.data?.forEach((json) => {
            const owner = json as Owner
            mapping.value.set(owner.id, owner)
          })
        }
      })
  }

  async function resolve(id: number) {
    const v = mapping.value.get(id)
    if (v) {
      return v
    }

    const response = await supabase.from('owners').select().eq('id', id)

    const map = new Map<number, Owner>()
    response.data?.forEach((json) => {
      const owner = json as Owner
      map.set(owner.id, owner)
      mapping.value.set(owner.id, owner)
    })

    return map.get(id)
  }

  async function search(text: string) {
    const response = await supabase
      .from('owners')
      .select()
      .ilike('name', '%' + text + '%')

    if (response.status == 200) {
      return response.data?.map((json) => json as Owner)
    }

    return []
  }

  return { initialized, loading, listing, create, update, resolve, search }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useOwnersStore, import.meta.hot))
}
