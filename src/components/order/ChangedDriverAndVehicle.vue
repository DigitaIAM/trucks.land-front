<script setup lang="ts">
import { useEventsStore } from '@/stores/order_events.ts'

const props = defineProps<{
  orderId: number | null | undefined
}>()

const eventsStore = useEventsStore()
const driversStore = useDriversStore()
const vehiclesStore = useVehiclesStore()

interface ChangeRecord {
  id: number
  driver: number | null
  vehicle: number | null
  cost: number
}

const changeRecords = ref<Array<ChangeRecord>>([])

watch(
  () => props.orderId,
  (id) => {
    resetAndShow(id)
  },
  { deep: true },
)

resetAndShow(props.orderId)

async function resetAndShow(id: number | null | undefined) {
  changeRecords.value = []

  if (!id) return

  const events = await eventsStore.fetching(id)
  const list = [] as Array<ChangeRecord>

  for (const event of events) {
    if (event.kind === 'change') {
      list.push({
        id: event.id,
        driver: event.driver ?? null,
        vehicle: event.vehicle ?? null,
        cost: Number(event.cost) || 0,
      })
    }
  }

  changeRecords.value = list
}
</script>

<template>
  <template v-if="changeRecords.length > 0">
    <div class="flex space-x-3">
      <div class="md:w-1/3 md:mb-0">
        <Label class="mt-1 mb-1">Driver</Label>
      </div>
      <div class="md:w-1/3 md:mb-0">
        <Label class="mt-1 mb-1">Vehicle</Label>
      </div>
      <div class="md:w-1/3 md:mb-0">
        <Label class="mt-1 mb-1">Driver payment $</Label>
      </div>
    </div>
    <div class="flex space-x-3 mb-3" v-for="record in changeRecords" :key="record.id">
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
</template>

<style scoped></style>
