import { ref } from 'vue'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { useInitializeStore } from '@/composables/use-initialize-store.ts'

export interface PickUp extends PickUpCreate {
  id: number
  created_at: string
}

export interface PickUpCreate {
  order: number
  note: string
  address1: string
  address2?: string
  city: string
  state: string
  zip: string
  datetime: Date
  priority: string
  timeliness: string
}

export interface PickUpUpdate {
  note?: string
  address1?: string
  address2?: string
  city?: string
  state?: string
  zip?: string
  datetime?: Date
  priority?: string
  timeliness?: string
}

export const usePickUpStore = defineStore('pick_up', () => {
  const mapping = ref(new Map<number, PickUp>())

  const { initialized, loading } = useInitializeStore(async () => {
    const response = await supabase.from('pick_up').select()

    const map = new Map<number, PickUp>()
    response.data?.forEach((json) => {
      const pick_up = json as PickUp
      map.set(pick_up.id, pick_up)
    })

    mapping.value = map
  })

  const listing = computed(() => {
    const list = [] as PickUp[]

    mapping.value.forEach((v) => {
      list.push(v)
    })

    return list
  })

  async function create(pick_up: PickUpCreate) {
    console.log('create', pick_up)
    const response = await supabase.from('pick_up').insert(pick_up).select().throwOnError()

    console.log('response', response)
    if (response.status == 201) {
      response.data?.forEach((json) => {
        const pick_up = json as PickUp
        mapping.value.set(pick_up.id, pick_up)
      })
    } else {
      throw 'unexpended response status: ' + response.status
    }
  }

  function update(id: number, pick_up: PickUpUpdate) {
    supabase
      .from('pick_up')
      .update(pick_up)
      .eq('id', id)
      .select()
      .then((response) => {
        if (response.status == 200) {
          response.data?.forEach((json) => {
            const pick_up = json as PickUp
            mapping.value.set(pick_up.id, pick_up)
          })
        }
      })
  }

  async function resolve(id: number) {
    const v = mapping.value.get(id)
    if (v) {
      return v
    }

    const response = await supabase.from('pick_up').select().eq('id', id)

    const map = new Map<number, PickUp>()
    response.data?.forEach((json) => {
      const pick_up = json as PickUp
      map.set(pick_up.id, pick_up)
      mapping.value.set(pick_up.id, pick_up)
    })

    return map.get(id)
  }

  return { initialized, loading, listing, create, update, resolve }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePickUpStore, import.meta.hot))
}
