<script setup lang="ts">
import { useEventsStore } from '@/stores/order_events.ts'

const props = defineProps<{
  orderId: number | null
}>()

const eventsStore = useEventsStore()
const driversStore = useDriversStore()
const vehiclesStore = useVehiclesStore()
const ordersStore = useOrdersStore()

const records = ref([])

watch(
  () => props.orderId,
  (id) => {
    resetAndShow(id)
  },
  { deep: true },
)

resetAndShow(props.orderId)

async function resetAndShow(id: number) {
  const map = new Map()

  const order = await ordersStore.resolve(id)
  const events = await eventsStore.fetching(id)
  for (const idx in events) {
    const event = events[idx]
    if (event.kind === 'agreement') {
      const m = map.get(event.driver) ?? new Map()
      let cost = m.get(event.vehicle) ?? 0

      if (event.percent) {
        cost = ((order!.cost * event.percent) / 100).toFixed(2)
      } else {
        cost += event.cost
      }

      m.set(event.vehicle, cost)
      map.set(event.driver, m)
    }
  }

  const list = []
  for (const [driver, m] of map.entries()) {
    for (const [vehicle, cost] of m.entries()) {
      list.push({ driver: driver, vehicle: vehicle, cost: cost })
    }
  }
  records.value = list
}
</script>

<template>
  <div class="flex space-x-3">
    <div class="md:w-1/3 md:mb-0">
      <Label class="mt-4 mb-1">Driver</Label>
    </div>
    <div class="md:w-1/3 md:mb-0">
      <Label class="mt-4 mb-1">Vehicle</Label>
    </div>
    <div class="md:w-1/3 md:mb-0">
      <Label class="mt-4 mb-1">Driver payment $</Label>
    </div>
  </div>
  <div v-for="record in records" class="flex space-x-3 mb-3">
    <div class="md:w-1/3 md:mb-0">
      <QueryAndShow asTextField :id="record.driver" :store="driversStore" />
    </div>
    <div class="md:w-1/3 md:mb-0">
      <QueryAndShow asTextField :id="record.vehicle" :store="vehiclesStore" />
    </div>
    <div class="md:w-1/3 md:mb-0">
      <TextInput disabled v-model="record.cost" class="flex w-full" />
    </div>
  </div>
</template>

<style scoped></style>
