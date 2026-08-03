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

export const useUserConditionsStore = defineStore('user_conditions', () => {
  const rOrgId = ref<number | null>(null)
  const rUserId = ref<number | null>(null)
  const mapping = ref(new Map<Key, Condition>())

  async function setContext(args: object): Promise<Condition | null> {
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

  async function getCondition(
    orgId: number | null,
    userId: number | null,
  ): Promise<Condition | null> {
    if (orgId && userId) {
      const { data, error } = await supabase
        .from('user_conditions')
        .select()
        .eq('organization', orgId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        console.log('error', error)
        return null
      }
      return (data?.[0] as Condition) ?? null
    }
    return null
  }

  async function employeesWithSalary() {
    const { data, error } = await supabase
      .from('user_conditions')
      .select('user_id')
      .not('fixed_salary', 'is', null)
      .gt('fixed_salary', 0)

    if (error) {
      console.error('error', error)
    } else {
      const userIds = data.map((item) => item.user_id)
      return userIds
    }
  }

  async function employeesWithConditions(orgId: number | null): Promise<number[]> {
    if (!orgId) return []

    const { data, error } = await supabase
      .from('user_conditions')
      .select('user_id')
      .eq('organization', orgId)

    if (error) {
      console.error('error', error)
      return []
    }

    return Array.from(new Set(data.map((item) => item.user_id)))
  }

  async function save(
    orgId: number,
    userId: number,
    params: {
      percent_of_gross?: number | null
      percent_of_profit: number | null
      fixed_salary: number | null
      income_tax: number | null
    },
    performedBy: number,
  ) {
    const existing = await getCondition(orgId, userId)

    if (existing) {
      const salaryChanged = existing.fixed_salary !== params.fixed_salary
      const profitChanged = existing.percent_of_profit !== params.percent_of_profit
      const taxChanged = existing.income_tax !== params.income_tax

      if (!salaryChanged && !profitChanged && !taxChanged) {
        const { error } = await supabase
          .from('user_conditions')
          .update(params)
          .eq('id', existing.id)

        if (error) throw error

        return existing.id
      }
    }

    const { data, error } = await supabase
      .from('user_conditions')
      .insert({
        organization: orgId,
        user_id: userId,
        ...params,
        created_by: performedBy,
      } as ConditionCreate)
      .select()
      .single()

    if (error) throw error

    return (data as Condition).id
  }

  return { setContext, listing, getCondition, employeesWithSalary, employeesWithConditions, save }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserConditionsStore, import.meta.hot))
}
