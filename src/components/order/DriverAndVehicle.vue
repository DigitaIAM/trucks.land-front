<script setup lang="ts">
import { useEventsStore } from '@/stores/events.ts'

const props = defineProps<{
  orderId: number | null
}>()

const eventsStore = useEventsStore()
const driversStore = useDriversStore()
const vehiclesStore = useVehiclesStore()

const records = ref([])

watch(
  () => props.orderId,
  (id) => {
    // console.log('watch id', id, props.id)
    resetAndShow(id)
  },
  { deep: true },
)

resetAndShow(props.orderId)

async function resetAndShow(id: number) {
  console.log('resetAndShow', id)

  const map = new Map()

  const events = await eventsStore.listing(id)
  for (const idx in events) {
    const event = events[idx]
    if (event.kind === 'agreement') {
      const m = map.get(event.driver) ?? new Map()
      let cost = m.get(event.vehicle) ?? 0

      cost += event.cost

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
  <div v-for="record in records" class="flex space-x-3 w-full mb-6">
    <div class="md:w-1/3 md:mb-0">
      <Label class="mb-1">Driver</Label>
      <QueryAndShow asTextField :id="record.driver" :store="driversStore" />
    </div>
    <div class="md:w-1/3 md:mb-0">
      <Label class="mb-1">Vehicle</Label>
      <QueryAndShow asTextField :id="record.vehicle" :store="vehiclesStore" />
    </div>
    <div class="md:w-1/3 md:mb-0">
      <Label class="mb-1">Driver payment $</Label>
      <TextInput disabled v-model="record.cost" />
    </div>
  </div>
</template>

<style scoped></style>
