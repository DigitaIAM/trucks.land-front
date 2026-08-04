import { acceptHMRUpdate, defineStore } from 'pinia'

export interface SimilarLoadVerified {
  id: number
  organization: number
  user_uuid: string
  group_key: string
  created_at: string
}

export const useSimilarLoadDismissalsStore = defineStore('similar_load_dismissals', () => {
  const verifiedKeys = ref(new Set<string>())

  const authStore = useAuthStore()

  async function load(orgId: number) {
    const response = await supabase
      .from('similar_load_dismissals')
      .select('group_key')
      .eq('organization', orgId)
      .eq('user_uuid', authStore.user?.id)

    if (response.status == 200) {
      verifiedKeys.value = new Set(response.data?.map((row) => row.group_key) ?? [])
    }
  }

  async function verify(orgId: number, groupKey: string) {
    if (verifiedKeys.value.has(groupKey)) {
      return
    }
    verifiedKeys.value.add(groupKey)
    const response = await supabase.from('similar_load_dismissals').insert({
      organization: orgId,
      user_uuid: authStore.user?.id,
      group_key: groupKey,
    })
    if (response.status != 201) {
      verifiedKeys.value.delete(groupKey)
    }
  }

  return { verifiedKeys, load, verify }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSimilarLoadDismissalsStore, import.meta.hot))
}
