import { acceptHMRUpdate, defineStore } from 'pinia'

export interface Condition extends ConditionCreate {
  id: number
  created_at: string
  created_by: number
}

export interface ConditionCreate {
  organization: number
  user_id: number
  percent_of_gross: number
  percent_of_profit: number
  fixed_salary: number
  income_tax: number
}

interface Key {
  organization: number
  user: number
}

export const useUserConditionsStore = defineStore('access_tokens', () => {
  const rOrgId = ref<number | null>(null)
  const rUserId = ref<number | null>(null)
  const mapping = ref(new Map<Key, Condition>())

  async function setContext(args: Object): Promise<Condition | null> {
    if (args.orgId) {
      rOrgId.value = args.orgId
    }
    if (args.userId) {
      rUserId.value = args.userId
    }

    const orgId = rOrgId.value
    const userId = rUserId.value

    const condition = await getCondition(orgId, userId)
    if (condition) {
      mapping.value[{ organization: orgId, user: userId } as Key] = condition
    }

    return condition
  }

  const listing = computed(() => {
    return mapping.value[{ organization: rOrgId.value, user: rUserId.value } as Key]
  })

  async function getCondition(orgId: number | null, userId: number | null): Promise<Condition | null> {
    console.log('orgId', orgId)
    console.log('userId', userId)
    if (orgId && userId) {
      const { data, error } = await supabase
        .from('user_conditions')
        .select()
        .eq('organization', orgId)
        .eq('user_id', userId)
        .maybeSingle()

      console.log('data', data)
      console.log('error', error)

      if (error) {
        console.log('error', error)
        return null
      }
      return data as Condition
    }
    return null
  }

  return { setContext, listing }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserConditionsStore, import.meta.hot))
}
