import { createClient } from '@supabase/supabase-js'
import type { OrderEvent } from '@/stores/order_events.ts'

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
      // console.log('payload', payload)
      if (payload.eventType == 'INSERT') {
        const nextState = payload.new as OrderStage

        useOrdersStore().onStateUpdate(nextState)
        useOrdersTracking().onStateUpdate(nextState)
      }
      // console.log('done')
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
      // console.log('payload', payload)
      if (payload.eventType == 'INSERT') {
        const newOrder = payload.new as Order

        useOrdersStore().onInsert(newOrder)
        // useOrdersTracking().onInsert(id, newOrder)
      } else if (payload.eventType == 'UPDATE') {
        const id = payload.old.id
        const newOrder = payload.new as Order

        useOrdersStore().onUpdate(id, newOrder)
        useOrdersTracking().onUpdate(id, newOrder)
      }
      // console.log('done')
    },
  )
  .subscribe()

const changesE = supabase
  .channel('realtime_order_events_channel')
  .on(
    'postgres_changes',
    {
      schema: 'public', // Subscribes to the "public" schema in Postgres
      event: '*',
      table: 'order_events', // Listen to all changes
    },
    (payload) => {
      console.log('changesE', payload)
      if (payload.eventType == 'INSERT') {
        const event = payload.new as OrderEvent

        // TODO useEventsStore().onEventInsert(event)

        useOrdersStore().onEventChange(event)
        // useOrdersTracking().onEventChange(event)
      } else if (payload.eventType == 'UPDATE') {
        const id = payload.old.id
        const event = payload.new as OrderEvent

        useEventsStore().onUpdate(id, event)
        useOrdersStore().onEventChange(event)
        useOrdersTracking().onEventChange(event)
      }
      // console.log('done')
    },
  )
  .subscribe()

export function useSupabase() {
  return supabase
}

export function useChanges() {
  return changes
}

export function useChangesOrders() {
  return changesOrders
}

export function useChangesEvents() {
  return changesE
}
