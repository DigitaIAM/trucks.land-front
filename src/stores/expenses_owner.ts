import { acceptHMRUpdate, defineStore } from 'pinia'
import { useInitializeStore } from '@/composables/use-initialize-store.ts'
import { sleep } from '@/utils/datetime.ts'

export interface ExpensesToOwner extends ExpensesToOwnerCreate {
  id: number
  create_at: string
}

export interface ExpensesToOwnerCreate {
  owner: number
  kind: string
  amount: number
  created_by: number
}

export interface ExpensesToOwnerUpdate {
  kind?: string
  amount?: number
}

export const useExpensesToOwnerStore = defineStore('expenses_to_owner', () => {
  const mapping = ref(new Map<number, ExpensesToOwner | Promise<ExpensesToOwner>>())

  const { initialized, loading } = useInitializeStore(async () => {
    const response = await supabase.from('expenses_to_owner').select()

    const map = new Map<number, ExpensesToOwner>()
    response.data?.forEach((json) => {
      const expense = json as ExpensesToOwner
      map.set(expense.id, expense)
    })

    mapping.value = map
  })

  const listing = computedAsync(async () => {
    const list = [] as ExpensesToOwner[]

    for (const obj of mapping.value.values()) {
      list.push(await obj)
    }

    return list
  })

  function create(expense: ExpensesToOwnerCreate) {
    supabase
      .from('expenses_to_owner')
      .insert(expense)
      .select()
      .then((response) => {
        if (response.status == 201) {
          response.data?.forEach((json) => {
            const expense = json as ExpensesToOwner
            mapping.value.set(expense.id, expense)
          })
        }
        console.log('response', response)
      })
  }

  function update(id: number, expense: ExpensesToOwnerUpdate) {
    supabase
      .from('expenses_to_owner')
      .update(expense)
      .eq('id', id)
      .select()
      .then((response) => {
        if (response.status == 200) {
          response.data?.forEach((json) => {
            const expense = json as ExpensesToOwner
            mapping.value.set(expense.id, expense)
          })
        }
      })
  }

  async function _fetching(id: number): Promise<ExpensesToOwner> {
    const response = await supabase.from('expenses_to_owner').select().eq('id', id)

    if (response.data && response.data.length > 0) {
      return response.data[0] as ExpensesToOwner
    }
    return { id: id, name: 'error loading' } as ExpensesToOwner
  }

  async function resolve(id: number | null): Promise<ExpensesToOwner | null> {
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

  return { listing, initialized, loading, create, update, resolve }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useExpensesToOwnerStore, import.meta.hot))
}
