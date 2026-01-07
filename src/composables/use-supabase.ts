import { createClient } from '@supabase/supabase-js'

// const supabaseUrl = process.env.SUPABASE_URL
// const supabaseKey = process.env.SUPABASE_KEY

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

const changes = supabase
  .channel('realtime_order_stages_channel')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'order_stages',
    },
    (payload) => {
      console.log('payload', payload)
      if (payload.eventType == 'INSERT') {
        const nextState = payload.new as OrderStage

        useOrdersStore().onStateUpdate(nextState)
        useOrdersTracking().onStateUpdate(nextState)
      }
      console.log('done')
    },
  )
  .subscribe()

const changesOrders = supabase
  .channel('realtime_orders_channel')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'orders',
    },
    (payload) => {
      console.log('payload', payload)
      if (payload.eventType == 'INSERT') {
      } else if (payload.eventType == 'UPDATE') {
        const id = payload.old.id
        const newOrder = payload.new as Order

        useOrdersStore().onUpdate(id, newOrder)
        // TODO useOrdersTracking().onStateUpdate(newOrder)
      }
      console.log('done')
    },
  )
  .subscribe()

export function useSupabase() {
  return supabase
}

export function useChanges() {
  return changes
}
