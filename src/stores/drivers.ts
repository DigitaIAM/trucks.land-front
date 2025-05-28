import { acceptHMRUpdate, defineStore } from 'pinia'
import { useInitializeStore } from '@/composables/use-initialize-store.ts'

export interface Driver {
  id: number
  created_at: string
  name: string
  user: string
  email: string
  phone: string
  licence: string
  company: string
  fix_payments: string
  percentage: string
  expiry_date: string
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

  function create(driver: Driver) {
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

  function update(driver: Driver) {
    supabase
      .from('drivers')
      .update(driver)
      .eq('id', driver.id)
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

  return { initialized, loading, listing, create, update }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDriversStore, import.meta.hot))
}
