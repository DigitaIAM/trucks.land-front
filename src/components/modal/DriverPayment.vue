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
    label: '',
    value: (v) =>
      resolve(
        v,
        'organization',
        () => ({ code3: '?' }),
        () => organizationsStore.resolve(v.order.organization),
        (map) => map.code3,
      ),
    size: 50,
  },
  {
    label: '#',
    value: (v: Order) => v.order.id,
    size: 20,
  },
  {
    label: 'Dispatcher',
    value: (v: Order) =>
      resolve(
        v,
        'dispatcher',
        () => ({ name: '?' }),
        () => usersStore.resolve(v.order.dispatcher),
        (map) => map.name,
      ),
    size: 90,
  },
  {
    label: 'Refs',
    value: (v: Order) => v.order.refs,
    size: 90,
  },
  {
    label: 'Broker',
    value: (v: Order) =>
      resolve(
        v,
        'broker',
        () => ({ name: '?' }),
        () => brokersStore.resolve(v.order.broker),
        (map) => map.name,
      ),
    size: 150,
  },
  {
    label: 'Vehicle',
    value: (v: Order) =>
      resolve(
        v,
        'vehicle',
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
    label: 'Cost',
    value: (v) => '$' + v.order.cost,
    size: 80,
  },
  {
    label: 'Payments',
    value: (v) => '$' + v.payments,
    size: 80,
  },
  {
    label: 'Expenses',
    value: (v) => '$' + v.expenses,
    size: 80,
  },
  {
    label: 'Status',
    value: (v) =>
      resolve(
        v,
        'status',
        () => ({ name: '?', color: '' }),
        () => statusesStore.resolve(v.order.status),
        (map) => map.name,
      ),
    size: 150,
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
      <div class="mt-4 mb-4">
        <Text bold size="lg">Orders</Text>
      </div>
      <table class="w-full text-left table-auto min-w-max">
        <thead>
          <tr>
            <th
              v-for="col in cols"
              class="p-4 border-b border-b-gray-400"
              :style="{ width: col.size + 'px' }"
            >
              <p class="block antialiasing font-bold leading-none">
                {{ col.label }}
              </p>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders">
            <td
              v-for="col in cols"
              class="py-3 px-4 border-b border-b-gray-400"
              :style="{ width: col.size + 'px' }"
            >
              <p
                class="block antialiasing font-normal leading-normal truncate"
                :style="{ width: col.size + 'px' }"
              >
                {{ col.value(order) }}
              </p>
            </td>
          </tr>
        </tbody>
      </table>
      <ModalAction>
        <form method="dialog">
          <Button>Close</Button>
        </form>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
