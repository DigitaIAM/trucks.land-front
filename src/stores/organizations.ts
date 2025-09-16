import { acceptHMRUpdate, defineStore } from 'pinia'
import { useInitializeStore } from '@/composables/use-initialize-store.ts'
import { sleep } from '@/utils/datetime.ts'

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
  domain: string
  url_logo: string
}

export interface OrganizationUpdate {
  code2?: string
  code3?: string
  address1?: string
  address2?: string
  name?: string
  billing_email?: string
  owner?: number
  domain?: string
  url_logo?: string
}

export const useOrganizationsStore = defineStore('organization', () => {
  const mapping = ref(new Map<number, Organization | Promise<Organization>>())

  const { initialized, loading } = useInitializeStore(async () => {
    const response = await supabase.from('organizations').select()

    const map = new Map<number, Organization>()
    response.data?.forEach((json) => {
      const organization = json as Organization
      map.set(organization.id, organization)
    })

    mapping.value = map
  })

  const listing = computedAsync(async () => {
    const list = [] as Organization[]

    for (const obj of mapping.value.values()) {
      list.push(await obj)
    }

    return list
  })

  async function create(organization: OrganizationCreate) {
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

  async function _fetching(id: number): Promise<Organization> {
    const response = await supabase.from('organizations').select().eq('id', id)

    if (response.data && response.data.length > 0) {
      return response.data[0] as Organization
    }
    return { id: id, name: 'error loading' } as Organization
  }

  async function resolve(id: number | null): Promise<Organization | null> {
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

  async function resolve3(id3: string) {
    const response = await supabase.from('organizations').select().ilike('code3', id3)

    const list = [] as Array<Organization>
    response.data?.forEach((json) => {
      const organization = json as Organization
      list.push(organization)
      mapping.value.set(organization.id, organization)
    })

    return list[0]
  }

  async function search(text: string) {
    const response = await supabase
      .from('organizations')
      .select()
      .ilike('name', '%' + text + '%')
      .limit(10)

    if (response.status == 200) {
      return response.data?.map((json) => json as Organization)
    }

    return []
  }

  return { initialized, loading, listing, create, update, resolve, resolve3, search }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useOrganizationsStore, import.meta.hot))
}
