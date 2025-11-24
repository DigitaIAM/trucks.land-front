<script setup lang="ts">
import { useEventsStore } from '@/stores/order_events.ts'

const props = defineProps<{
  orderId: number | null
}>()

const eventsStore = useEventsStore()
const driversStore = useDriversStore()
const vehiclesStore = useVehiclesStore()
const ordersStore = useOrdersStore()
const ownersStore = useOwnersStore()

const companyRecords = ref<Array<CostRecord>>([])
const vehicleRecords = ref<Array<CostRecord>>([])

watch(
  () => props.orderId,
  (id) => {
    resetAndShow(id)
  },
  { deep: true },
)

resetAndShow(props.orderId)

interface CostRecord {
  company: number | null
  driver: number | null
  vehicle: number | null
  cost: number
}

async function resetAndShow(id: number) {
  const mapVehicle = new Map()
  const mapOwners = new Map()

  const order = await ordersStore.resolve(id)
  const events = await eventsStore.fetching(id)
  for (const idx in events) {
    const event = events[idx]
    if (event.kind === 'agreement') {
      if (event.company) {
        let cost = mapOwners.get(event.company) ?? 0

        if (event.percent) {
          cost += (order!.cost * event.percent) / 100
        } else {
          cost += event.cost
        }

        mapOwners.set(event.company, cost)
      } else {
        const m = mapVehicle.get(event.driver) ?? new Map()
        let cost = m.get(event.vehicle) ?? 0

        if (event.percent) {
          cost += (order!.cost * event.percent) / 100
        } else {
          cost += event.cost
        }

        m.set(event.vehicle, cost)
        mapVehicle.set(event.driver, m)
      }
    }
  }

  const companyList = [] as Array<CostRecord>
  const vehicleList = [] as Array<CostRecord>
  for (const [company, cost] of mapOwners.entries()) {
    companyList.push({ company: company, cost: cost } as CostRecord)
  }
  for (const [driver, m] of mapVehicle.entries()) {
    for (const [vehicle, cost] of m.entries()) {
      vehicleList.push({ driver: driver, vehicle: vehicle, cost: cost } as CostRecord)
    }
  }
  companyRecords.value = companyList
  vehicleRecords.value = vehicleList
}
</script>

<template>
  <template v-if="companyRecords.length > 0">
    <div class="flex space-x-3">
      <div class="md:w-2/3 md:mb-0">
        <Label class="mt-4 mb-1">Company</Label>
      </div>
      <div class="md:w-1/3 md:mb-0">
        <Label class="mt-4 mb-1">Company payment $</Label>
      </div>
    </div>
    <div class="flex space-x-3 mb-3" v-for="record in companyRecords" :key="record.company">
      <div class="md:w-2/3 md:mb-0">
        <QueryAndShow asTextField :id="record.company" :store="ownersStore" />
      </div>
      <div class="md:w-1/3 md:mb-0">
        <TextInput disabled v-model="record.cost" class="flex w-full" />
      </div>
    </div>
  </template>

  <template v-if="vehicleRecords.length > 0">
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
    <div class="flex space-x-3 mb-3" v-for="record in vehicleRecords">
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
