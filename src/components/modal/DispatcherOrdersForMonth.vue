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
    value: (v: Order) => v.number,
    size: 70,
  },
  {
    label: 'date',
    value: (v: Order) => useDateFormat(v.created_at, 'MMM DD'),
    size: 70,
  },
  {
    label: 'Unit Id',
    value: (v: Order) =>
      resolve(
        v,
        'vehicle_' + v.vehicle,
        () => ({ name: '-' }),
        () => vehiclesStore.resolve(v.vehicle),
        (map) => map.name,
      ),
    size: 70,
  },
  {
    label: 'cost',
    value: (v: Order) => '$' + v.cost,
    size: 100,
  },
  {
    label: 'payments to driver',
    value: (v: Order) => '$' + props.summary?.paymentsByOrder.get(v.id),
    size: 100,
  },
]

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
        <Text size="lg">Orders {{ summary?.orders_number }}</Text>
        <Text size="lg">Orders amount $ {{ summary?.orders_amount }}</Text>
        <Text size="lg">Driver payments $ {{ summary?.orders_driver }}</Text>
        <Text size="lg">Profit $ {{ summary?.orders_profit }}</Text>
      </div>

      <div class="mb-4 mt-10">
        <Text bold size="lg" class="mb-4 mt-4">Orders</Text>
      </div>
      <div class="overflow-clip flex flex-col">
        <table class="w-full table-fixed text-left">
          <thead>
            <tr
              class="text-sm text-gray-700 uppercase dark:text-gray-400 border-b dark:border-gray-700 border-gray-200"
            >
              <th
                v-for="col in cols"
                class="p-4"
                :key="col.label"
                :style="{ width: col.size + 'px' }"
              >
                <p class="block antialiasing tracking-wider font-thin leading-none">
                  {{ col.label }}
                </p>
              </th>
            </tr>
          </thead>
        </table>
        <div class="flex-1 overflow-y-auto">
          <table class="w-full table-fixed">
            <tbody>
              <tr
                v-for="order in props.summary?.orders.values() || []"
                :key="order.id"
                class="hover:bg-base-200"
              >
                <td
                  v-for="col in cols"
                  :key="order.id + '_' + col.label"
                  class="py-3 px-4"
                  :style="{ width: col.size + 'px' }"
                >
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
        </div>
      </div>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
