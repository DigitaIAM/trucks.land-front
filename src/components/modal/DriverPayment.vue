<script setup lang="ts">
import { useReportDriver } from '@/stores/report_driver.ts'
import { useStatusesStore } from '@/stores/statuses.ts'
import { useUsersStore } from '@/stores/users.ts'

const props = defineProps<{
  driverId: number | null
}>()

const driversStore = useDriversStore()
const reportStore = useReportDriver()

const brokersStore = useBrokersStore()
const statusesStore = useStatusesStore()
const usersStore = useUsersStore()
const organizationsStore = useOrganizationsStore()
const vehiclesStore = useVehiclesStore()

watch(
  () => props.driverId,
  (id) => {
    resetAndShow(id)
  },
  { deep: true },
)

function resetAndShow(id: number) {
  payment_driver.showModal(id)
}

const state = reactive({})

function resolve(
  order: Order,
  name: string,
  create: () => object,
  request: () => Promise<object | null>,
  label: (obj: object) => string,
) {
  const s = state[order.id] ?? {}
  if (s && s[name]) {
    return label(s[name])
  } else {
    s[name] = create()
    state[order.id] = s
    request().then((obj) => {
      if (obj) state[order.id][name] = obj
    })
    return label(s[name])
  }
}

const cols = [
  {
    label: '#',
    value: (v: Order) => v.order.id,
    size: 20,
  },
  {
    label: 'dispatcher',
    value: (v: Order) =>
      resolve(
        v,
        'dispatcher_' + v.dispatcher,
        () => ({ name: '?' }),
        () => usersStore.resolve(v.order.dispatcher),
        (map) => map.name,
      ),
    size: 150,
  },
  {
    label: 'refs',
    value: (v: Order) => v.order.refs,
    size: 90,
  },
  {
    label: 'broker',
    value: (v: Order) =>
      resolve(
        v,
        'broker_' + v.broker,
        () => ({ name: '?' }),
        () => brokersStore.resolve(v.order.broker),
        (map) => map.name,
      ),
    size: 150,
  },
  {
    label: 'vehicle',
    value: (v: Order) =>
      resolve(
        v,
        'vehicle_' + v.vehicle,
        () => [],
        async () => {
          const list = []
          for (const vehicle of v.vehicles) {
            const data = await vehiclesStore.resolve(vehicle)
            if (data) {
              list.push(data)
            }
          }
          return list
        },
        (list) => list.map((v) => v.name).join(', '),
      ),
    size: 120,
  },
  {
    label: 'cost',
    value: (v) => '$' + v.order.cost,
    size: 80,
  },
  {
    label: 'payments',
    value: (v) => '$' + v.payments,
    size: 80,
  },
  {
    label: 'expenses',
    value: (v) => '$' + v.expenses,
    size: 80,
  },
  {
    label: 'status',
    value: (v) =>
      resolve(
        v,
        'status_' + v.status,
        () => ({ name: '?', color: '' }),
        () => statusesStore.resolve(v.order.status),
        (map) => map.name,
      ),
    size: 200,
  },
]

const summary = computed(() => {
  for (const summary of reportStore.drivers) {
    if (summary.driver == props.driverId) {
      return summary
    }
  }
})

const orders = computed(() => {
  const data = summary.value

  if (data) {
    const orders = data.orders.values().toArray()

    return orders.map((v) => ({
      order: v,
      payments: data.paymentsByOrder.get(v.id) ?? 0,
      expenses: data.expensesByOrder.get(v.id) ?? 0,
      vehicles: data.vehiclesByOrder.get(v.id) ?? [],
    }))
  } else {
    return []
  }
})
</script>

<template>
  <Modal id="payment_driver">
    <ModalBox class="max-w-[calc(90vw-6.25rem)]">
      <div class="grid grid-cols-2 gap-2">
        <div>
          <Text size="2xl">
            <QueryAndShow :id="props.driverId" :store="driversStore" />
          </Text>
        </div>
      </div>
      <div class="mb-4 mt-4">
        <Text bold size="lg" class="mb-4 mt-4">Orders</Text>
      </div>
      <table class="w-full text-left table-auto min-w-max">
        <thead>
          <tr
            class="text-sm text-gray-700 uppercase dark:text-gray-400 border-b dark:border-gray-700 border-gray-200"
          >
            <th v-for="col in cols" class="p-4" :style="{ width: col.size + 'px' }">
              <p class="block antialiasing tracking-wider font-thin leading-none">
                {{ col.label }}
              </p>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders">
            <td v-for="col in cols" class="py-3 px-4" :style="{ width: col.size + 'px' }">
              <p
                class="block antialiasing tracking-wide font-light leading-normal truncate"
                :style="{ width: col.size + 'px' }"
              >
                {{ col.value(order) }}
              </p>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="flex flex-cols-5 gap-40 mt-10">
        <Text bold size="lg">Total</Text>
        <Text size="lg">Orders {{ summary?.number_of_orders }}</Text>
        <Text size="lg">Orders amount $ {{ summary?.amount_in_orders }}</Text>
        <Text size="lg">Payment $ {{ summary?.payments }}</Text>
        <Text size="lg">Expenses $ {{ summary?.expenses }}</Text>
      </div>
      <ModalAction>
        <form method="dialog">
          <Button class="btn-soft font-light tracking-wider ml-6">Close</Button>
        </form>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
