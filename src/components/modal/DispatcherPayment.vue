<script setup lang="ts">
import { useUsersStore } from '@/stores/users.ts'
import { useReportDispatcher } from '@/stores/employee_unpaid_orders.ts'
import type { SettlementEmployee } from '@/stores/employee_settlements.ts'

const props = defineProps<{
  employeeId: number | null
}>()

const reportStore = useReportDispatcher()
const usersStore = useUsersStore()
const brokersStore = useBrokersStore()

watch(
  () => props.employeeId,
  (id) => {
    resetAndShow(id)
  },
  { deep: true }
)

const emit = defineEmits(['close'])

function resetAndShow(id: number) {
  orders_dispatcher.showModal(id)
}

const state = reactive({})

function resolve(
  order: Order,
  name: string,
  create: () => object,
  request: () => Promise<object | null>,
  label: (obj: object) => string
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
    size: 30
  },
  {
    label: 'refs',
    value: (v: Order) => v.refs,
    size: 150
  },
  {
    label: 'broker',
    value: (v: Order) =>
      resolve(
        v,
        'broker_' + v.broker,
        () => ({ name: '?' }),
        () => brokersStore.resolve(v.broker),
        (map) => map.name
      ),
    size: 200
  },
  {
    label: 'cost',
    value: (v: Order) => '$' + v.cost,
    size: 100
  },
  {
    label: 'payments to driver',
    value: (v: Order) => '$' + summary.value?.paymentsByOrder.get(v.id),
    size: 100
  }
]

const summary = computed(() => {
  for (const summary of reportStore.employees) {
    if (summary.employee == props.employeeId) {
      return summary
    }
  }
})

const orders = computed(() => {
  const data = summary.value

  if (data) {
    return data.orders.values().toArray()
  } else {
    return []
  }
})

const settlements = computed(() => {
  const data = summary.value

  if (data) {
    return data.settlements
  } else {
    return []
  }
})

const settlementsCols = [
  {
    label: '#',
    value: (v: SettlementEmployee) => v.id,
    size: 50
  },

  {
    label: 'details',
    value: (v: SettlementEmployee) => v.notes,
    size: 200
  },
  {
    label: 'amount',
    value: (v: SettlementEmployee) => '$' + v.amount,
    size: 120
  }
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
          <QueryAndShow name="real_name" :id="props.dispatcherId" :store="usersStore" />
        </Text>
        <Text size="2xl" class="px-4">to pay $ {{ summary?.payout.toFixed(2) }}</Text>
      </div>

      <div class="flex flex-cols-7 gap-20 mt-10">
        <Text bold size="lg">Total</Text>
        <Text size="lg">Orders {{ summary?.orders_number }}</Text>
        <Text size="lg">Orders amount $ {{ summary?.orders_amount }}</Text>
        <Text size="lg">Driver payments $ {{ summary?.orders_driver.toFixed(2) }}</Text>
        <Text size="lg"> Percent of gross % {{ summary?.paymentTerms.percent_of_gross }}</Text>
        <Text size="lg">Settlements $ {{ summary?.settlements_total }}</Text>
        <Text size="lg">Payout $ {{ summary?.payout.toFixed(2) }}</Text>
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
            <tr v-for="order in orders" :key="order.id" class="hover:bg-base-200">
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
        <div class="mt-10">
          <Text bold size="lg" class="mb-4">Settlements</Text>
          <table class="w-full text-left table-auto min-w-max">
            <thead>
            <tr
              class="text-sm text-gray-700 uppercase dark:text-gray-400 border-b dark:border-gray-700 border-gray-200"
            >
              <th
                v-for="col in settlementsCols"
                :key="col.label"
                class="p-4"
                :style="{ width: col.size + 'px' }"
              >
                <p class="block antialiasing tracking-wider font-thin leading-none">
                  {{ col.label }}
                </p>
              </th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="settlement in settlements" :key="settlement.id">
              <td
                v-for="col in settlementsCols"
                :key="col.label"
                class="py-3 px-4"
                :style="{ width: col.size + 'px' }"
              >
                <p
                  class="block antialiasing tracking-wide font-light leading-normal truncate"
                  :style="{ width: col.size + 'px' }"
                >
                  {{ col.value(settlement) }}
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
