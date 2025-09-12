import { acceptHMRUpdate, defineStore } from 'pinia'

export const useAccessTokenStore = defineStore('access_tokens', () => {
  async function getTokenZoho(orgId: number | null): Promise<string | null> {
    if (orgId) {
      const { data, error } = await supabase
        .from('access_tokens')
        .select()
        .eq('organization', orgId)
        .eq('key', 'zoho')
        .maybeSingle()

      if (error) {
        console.log('error', error)
        return null
      }
      return data['token'] as string
    }
    return null
  }

  return { getTokenZoho }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAccessTokenStore, import.meta.hot))
}
