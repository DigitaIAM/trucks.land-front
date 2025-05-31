import { acceptHMRUpdate, defineStore } from 'pinia'
import { useInitializeStore } from '@/composables/use-initialize-store.ts'

export interface Organization extends OrganizationCreate {
  id: number
  created_at: string
}

export interface OrganizationCreate {
  code2: string
  code3: string
  address1: string
  address2: string
  name: string
  billing_email: string
  owner: number
}

export interface OrganizationUpdate {
  code2?: string
  code3?: string
  address1?: string
  address2?: string
  name?: string
  billing_email?: string
  owner?: number
}

export const useOrganizationsStore = defineStore('organization', () => {
  const mapping = ref(new Map<number, Organization>())

  const { initialized, loading } = useInitializeStore(async () => {
    const response = await supabase.from('organizations').select()

    const map = new Map<number, Organization>()
    response.data?.forEach((json) => {
      const organization = json as Organization
      map.set(organization.id, organization)
    })

    mapping.value = map
  })

  const listing = computed(() => {
    const list = [] as Organization[]

    mapping.value.forEach((v) => {
      list.push(v)
    })

    return list
  })

  async function create(organization: OrganizationCreate) {
    console.log('create', organization)
    const response = await supabase
      .from('organizations')
      .insert(organization)
      .select()
      .throwOnError()

    if (response.status == 201) {
      response.data?.forEach((json) => {
        const organization = json as Organization
        mapping.value.set(organization.id, organization)
      })
    } else {
      throw 'unexpended response status: ' + response.status
    }
  }

  function update(id: number, organization: OrganizationUpdate) {
    supabase
      .from('organizations')
      .update(organization)
      .eq('id', id)
      .select()
      .then((response) => {
        if (response.status == 200) {
          response.data?.forEach((json) => {
            const organization = json as Organization
            mapping.value.set(organization.id, organization)
          })
        }
      })
  }

  function resolve(id: number) {
    return mapping.value.get(id)
  }

  return { initialized, loading, listing, create, update, resolve }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useOrganizationsStore, import.meta.hot))
}
