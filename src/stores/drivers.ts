import { acceptHMRUpdate, defineStore } from 'pinia'
import { useInitializeStore } from '@/composables/use-initialize-store.ts'

export interface Driver extends DriverCreate {
  id: number
  created_at: string
}

export interface DriverCreate {
  name: string
  user: string
  email: string
  phone: string
  licence: string
  company: string
  fix_payments: string
  percentage: string
  expiry_date: Date
}

export interface DriverUpdate {
  name?: string
  user?: string
  email?: string
  phone?: string
  licence?: string
  company?: string
  fix_payments?: string
  percentage?: string
  expiry_date?: Date
}

export const useDriversStore = defineStore('driver', () => {
  const mapping = ref(new Map<number, Driver>())

  const { initialized, loading } = useInitializeStore(async () => {
    const response = await supabase.from('drivers').select()

    const map = new Map<number, Driver>()
    response.data?.forEach((json) => {
      const driver = json as Driver
      map.set(driver.id, driver)
    })

    mapping.value = map
  })

  const listing = computed(() => {
    const list = [] as Driver[]

    mapping.value.forEach((v) => {
      list.push(v)
    })

    return list
  })

  function create(driver: DriverCreate) {
    supabase
      .from('drivers')
      .insert(driver)
      .select()
      .then((response) => {
        console.log('response', response)
        if (response.status == 201) {
          response.data?.forEach((json) => {
            const driver = json as Driver
            mapping.value.set(driver.id, driver)
          })
        }
      })
  }

  function update(id: number, driver: DriverUpdate) {
    supabase
      .from('drivers')
      .update(driver)
      .eq('id', id)
      .select()
      .then((response) => {
        if (response.status == 200) {
          response.data?.forEach((json) => {
            const driver = json as Driver
            mapping.value.set(driver.id, driver)
          })
        }
      })
  }

  async function resolve(id: number) {
    // console.log('driver resolve', id)
    if (!(id && id >= 0)) {
      // console.log('id is not number')
      return null
    }

    const v = mapping.value.get(id)
    if (v) {
      return v
    }

    const response = await supabase.from('drivers').select().eq('id', id)

    const map = new Map<number, Driver>()
    response.data?.forEach((json) => {
      const driver = json as Driver
      map.set(driver.id, driver)
      mapping.value.set(driver.id, driver)
    })

    return map.get(id)
  }

  async function search(text: string) {
    console.log('driver search', text)

    const response = await supabase
      .from('drivers')
      .select()
      .ilike('name', '%' + text + '%')
      .limit(10)

    console.log('response', response)

    if (response.status == 200) {
      return response.data?.map((json) => json as Driver)
    }

    return []
  }

  return { initialized, loading, listing, create, update, resolve, search }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDriversStore, import.meta.hot))
}
