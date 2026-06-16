<script setup lang="ts">
import { type EmployeePaymentSummary } from '@/stores/employee_unpaid_orders.ts'

const props = defineProps<{
  summary: EmployeePaymentSummary | null
}>()

const usersStore = useUsersStore()
const vehiclesStore = useVehiclesStore()

watch(
  () => props.summary,
  (id) => {
    resetAndShow(id)
  },
  { deep: true },
)

const emit = defineEmits(['close'])

function resetAndShow() {
  orders_dispatcher.showModal()
}

const resolvedVehicles = reactive<Record<number, { name: string }>>({})

const vehicleRows = computed(() => {
  if (!props.summary) return []

  const vehicleMap = new Map<number, { ordersCount: number; totalProfit: number }>()
  let noVehicleOrders = 0
  let noVehicleProfit = 0

  for (const [orderId, order] of props.summary.orders) {
    const profit = (order.cost || 0) - (order.driver_cost || 0)
    const vehicleId = props.summary.orderToVehicle.get(Number(orderId))

    if (vehicleId) {
      const d = vehicleMap.get(vehicleId) || { ordersCount: 0, totalProfit: 0 }
      d.ordersCount++
      d.totalProfit += profit
      vehicleMap.set(vehicleId, d)
      // Trigger lazy resolve
      if (!resolvedVehicles[vehicleId]) {
        resolvedVehicles[vehicleId] = { name: '...' }
        vehiclesStore.resolve(vehicleId).then((v) => {
          if (v) resolvedVehicles[vehicleId] = { name: v.name ?? '-' }
        })
      }
    } else {
      noVehicleOrders++
      noVehicleProfit += profit
    }
  }

  const rows: Array<{
    vehicleId: number | null
    vehicleName: string
    ordersCount: number
    totalProfit: number
  }> = []

  for (const [vehicleId, data] of vehicleMap) {
    rows.push({
      vehicleId,
      vehicleName: resolvedVehicles[vehicleId]?.name ?? '...',
      ordersCount: data.ordersCount,
      totalProfit: data.totalProfit,
    })
  }

  if (noVehicleOrders > 0) {
    rows.push({
      vehicleId: null,
      vehicleName: 'No vehicle',
      ordersCount: noVehicleOrders,
      totalProfit: noVehicleProfit,
    })
  }

  return rows.sort((a, b) => b.totalProfit - a.totalProfit)
})

const totalOrders = computed(() => {
  return vehicleRows.value.reduce((sum, r) => sum + r.ordersCount, 0)
})

const totalProfit = computed(() => {
  return vehicleRows.value.reduce((sum, r) => sum + r.totalProfit, 0)
})

function close() {
  orders_dispatcher.close()
  emit('close')
}
</script>

<template>
  <Modal id="orders_dispatcher">
    <ModalBox class="max-w-[calc(90vw-6.25rem)]">
      <div class="flex place-self-end">
        <Button class="btn-soft font-light tracking-wider" @click="close">Close</Button>
      </div>
      <div class="flex-col">
        <Text size="2xl">
          <QueryAndShow name="name" :id="props.summary?.employee" :store="usersStore" />
        </Text>
      </div>

      <div class="flex flex-cols-7 gap-20 mt-10">
        <Text bold size="lg">Total</Text>
        <Text size="lg">Orders {{ totalOrders }}</Text>
        <Text size="lg">Profit $ {{ totalProfit.toFixed(0) }}</Text>
      </div>

      <div class="mb-4 mt-10">
        <Text bold size="lg" class="mb-4 mt-4">Vehicles</Text>
      </div>
      <div class="overflow-clip flex flex-col">
        <table class="w-full table-fixed text-left">
          <thead>
            <tr
              class="text-sm text-gray-700 uppercase dark:text-gray-400 border-b dark:border-gray-700 border-gray-200"
            >
              <th class="p-4" style="width: 200px">
                <p class="block antialiasing tracking-wider font-thin leading-none">Unit Id</p>
              </th>
              <th class="p-4" style="width: 100px">
                <p class="block antialiasing tracking-wider font-thin leading-none">
                  количество грузов
                </p>
              </th>
              <th class="p-4" style="width: 100px">
                <p class="block antialiasing tracking-wider font-thin leading-none">Profit</p>
              </th>
            </tr>
          </thead>
        </table>
        <div class="flex-1 overflow-y-auto">
          <table class="w-full table-fixed">
            <tbody>
              <tr
                v-for="row in vehicleRows"
                :key="row.vehicleId ?? 'no-vehicle'"
                class="hover:bg-base-200"
              >
                <td class="py-3 px-4" style="width: 200px">
                  <p
                    class="block antialiasing tracking-wide font-light leading-normal truncate"
                    style="width: 200px"
                  >
                    {{ row.vehicleName }}
                  </p>
                </td>
                <td class="py-3 px-4" style="width: 100px">
                  <p
                    class="block antialiasing tracking-wide font-light leading-normal truncate"
                    style="width: 100px"
                  >
                    {{ row.ordersCount }}
                  </p>
                </td>
                <td class="py-3 px-4" style="width: 100px">
                  <p
                    class="block antialiasing tracking-wide font-light leading-normal truncate"
                    style="width: 100px"
                  >
                    ${{ row.totalProfit.toFixed(0) }}
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
