import { acceptHMRUpdate, defineStore } from 'pinia'

export interface AgreementCostLog {
  id: number
  organization: number
  document: number
  event_id: number
  old_cost: number | null
  new_cost: number | null
  created_by: number
  created_at: Date
}

export const useAgreementCostLogsStore = defineStore('agreement_cost_logs', () => {
  const listing = ref<Array<AgreementCostLog>>([])

  const changes = supabase
    .channel('agreement-cost-log-changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'agreement_cost_log',
      },
      (payload) => {
        listing.value.unshift(payload.new as AgreementCostLog)
      },
    )
    .subscribe()

  async function fetching(organization: number): Promise<Array<AgreementCostLog>> {
    const response = await supabase
      .from('agreement_cost_log')
      .select()
      .eq('organization', organization)
      .order('created_at', { ascending: false })

    if (response.status == 200) {
      const list: Array<AgreementCostLog> = []
      response.data?.forEach((json) => {
        const log = json as AgreementCostLog
        list.push(log)
      })
      listing.value = list
      return list
    } else {
      throw 'unexpended response status: ' + response.status
    }
  }

  return { listing, fetching, changes }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAgreementCostLogsStore, import.meta.hot))
}
