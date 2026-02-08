import { acceptHMRUpdate, defineStore } from 'pinia'

export interface AccessMatrix extends AccessMatrixCreate {
  id: number
  created_at: string
  created_by: number
}

export interface AccessMatrixCreate {
  organization: number
  user_uuid: number
  user_id: number
  is_admin: boolean
  is_dispatcher: boolean
  is_tracking: boolean
  is_accountant: boolean
  is_hr: boolean
  is_payroll_accountant: boolean
  team: number
}

interface Key {
  organization: number
  user: number
}

export const useAccessMatrixStore = defineStore('access_matrix', () => {
  const rOrgId = ref<number | null>(null)
  const rUserId = ref<number | null>(null)
  const mapping = ref(new Map<Key, AccessMatrix>())

  async function setContext(args: Object): Promise<AccessMatrix | null> {
    if (args.orgId) {
      rOrgId.value = args.orgId
    }
    if (args.userId) {
      rUserId.value = args.userId
    }

    const orgId = rOrgId.value
    const userId = rUserId.value

    const access = await getAccessMatrix(orgId, userId)
    if (access) {
      mapping.value[{ organization: orgId, user: userId } as Key] = access
    }

    return access
  }

  const listing = computed(() => {
    return mapping.value[{ organization: rOrgId.value, user: rUserId.value } as Key]
  })

  async function getAccessMatrix(
    orgId: number | null,
    userId: string | null,
  ): Promise<string | null> {
    // console.log('orgId', orgId)
    // console.log('userId', userId)
    if (orgId && userId) {
      const { data, error } = await supabase
        .from('access_matrix')
        .select()
        .eq('organization', orgId)
        .eq('user_id', userId)
        .maybeSingle()

      // console.log('data', data)
      // console.log('error', error)

      if (error) {
        console.log('error', error)
        return null
      }
      return data as AccessMatrix
    }
    return null
  }

  return { setContext, listing, getAccessMatrix }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAccessMatrixStore, import.meta.hot))
}
