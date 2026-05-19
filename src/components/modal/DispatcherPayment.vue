<script setup lang="ts">
import { useUsersStore } from '@/stores/users.ts'
import { type EmployeePaymentSummary } from '@/stores/employee_unpaid_orders.ts'
import type { SettlementEmployee } from '@/stores/employee_settlements.ts'

const props = defineProps<{
  summary: EmployeePaymentSummary | null
}>()

const usersStore = useUsersStore()
const statusesStore = useStatusesStore()
const organizationsStore = useOrganizationsStore()

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
    value: (v: Order) => useDateMyFormat(v.created_at),
    size: 200,
  },
  {
    label: 'cost',
    value: (v: Order) => '$' + +(Number(v.cost) || 0).toFixed(0),
    size: 100,
  },
  {
    label: 'payments to driver',
    value: (v: Order) => {
      const payment =
        props.summary?.paymentsByOrder.get(v.id) || v.driver_cost || v.driver_payment || 0
      return '$' + Number(payment).toFixed(0)
    },
    size: 100,
  },
  {
    label: 'notes',
    value: (v: Order) =>
      resolve(
        v,
        'notes',
        () => '',
        () => {
          const summary = props.summary
          const payments = summary?.paymentsByOrder?.get(v.id)

          if (!payments || v.stage === 3) {
            return statusesStore.resolve(v.stage)
          }

          if (v.vehicle_found_by) {
            return Promise.resolve({ name: 'vehicle was found' })
          }

          if (v.employee) {
            return Promise.resolve({ name: '' })
          }

          return Promise.resolve({ name: '' })
        },
        (map) => map?.name || '',
      ),
    size: 200,
  },
]

const settlementsCols = [
  {
    label: '#',
    value: (v: SettlementEmployee) => v.id,
    size: 70,
  },

  {
    label: 'details',
    value: (v: SettlementEmployee) => v.settlement_type,
    size: 200,
  },
  {
    label: 'amount',
    value: (v: SettlementEmployee) => '$' + v.amount,
    size: 120,
  },
]

function close() {
  orders_dispatcher.close()
  emit('close')
}

const sortedOrders = computed(() => {
  const list = Array.from(props.summary?.orders.values() || [])

  list.sort((a, b) => a.id - b.id)

  return list
})

const sortedOrdersInProgress = computed(() => {
  const list = Array.from(props.summary?.orders_in_progress.values() || [])

  list.sort((a, b) => a.id - b.id)

  return list
})

async function openOrder(order: Order) {
  const org = await organizationsStore.resolve(order.organization)
  window.open('/' + org?.code3.toLowerCase() + '/order/' + order.id, '_blank')
  // console.log('org.code3', org)
}

const toPayProfit = computed(() => {
  const percent = props.summary?.paymentTerms.percent_of_profit || 0
  const profit = props.summary?.orders_profit || 0
  return (percent * profit) / 100
})
</script>

<template>
  <Modal id="orders_dispatcher">
    <ModalBox class="max-w-[calc(90vw-6.25rem)]">
      <div class="flex justify-between items-center w-full mb-4 mt-2">
        <div class="flex-col">
          <Text size="2xl">
            <QueryAndShow name="real_name" :id="props.summary?.employee" :store="usersStore" />
          </Text>
        </div>
        <div class="flex place-self-end">
          <Button class="btn-soft font-light tracking-wider" @click="close">Close</Button>
        </div>
      </div>

      <div
        class="mt-10 mb-6 overflow-hidden rounded-xl border border-[#526471] shadow-md bg-[#3e4d59] text-[#e2e9ef]"
      >
        <table class="w-full text-left text-sm border-collapse">
          <tbody class="divide-y divide-[#526471]">
            <!-- Orders Section -->
            <tr>
              <td
                rowspan="3"
                class="px-6 py-4 font-semibold text-white align-top bg-[#33414b] w-[200px] text-xs uppercase tracking-wider"
              >
                Orders
              </td>
              <td class="px-6 py-3 text-[#cbd5e0]">quantity (total / in progress)</td>
              <td class="px-6 py-3 text-right font-medium text-white">
                {{ summary?.orders_number || 0 }} / {{ summary?.orders_in_progress?.size || 0 }}
              </td>
            </tr>
            <tr>
              <td class="px-6 py-3 text-[#cbd5e0] border-t border-[#526471]">orders amount</td>
              <td class="px-6 py-3 text-right font-medium text-white">
                $ {{ (summary?.orders_amount || 0).toFixed(2) }}
              </td>
            </tr>
            <tr>
              <td class="px-6 py-3 text-[#cbd5e0] border-t border-[#526471]">driver payments</td>
              <td class="px-6 py-3 text-right font-medium text-white">
                $ {{ (summary?.orders_driver || 0).toFixed(2) }}
              </td>
            </tr>

            <!-- Profit Section -->
            <tr>
              <td
                rowspan="2"
                class="px-6 py-4 font-semibold text-white align-top bg-[#33414b] text-xs uppercase tracking-wider"
              >
                Profit
              </td>
              <td class="px-6 py-3 text-[#cbd5e0] border-t border-[#526471]">total profit</td>
              <td class="px-6 py-3 text-right text-white font-medium">
                $ {{ (summary?.orders_profit || 0).toFixed(2) }}
              </td>
            </tr>
            <tr>
              <td class="px-6 py-3 text-[#cbd5e0] border-t border-[#526471]">direct profit</td>
              <td class="px-6 py-3 text-right text-white font-medium">
                $ {{ (summary?.orders_profit_direct || 0).toFixed(2) }}
              </td>
            </tr>

            <!-- Commission Section -->
            <tr>
              <td
                rowspan="2"
                class="px-6 py-4 font-semibold text-white align-top bg-[#33414b] text-xs uppercase tracking-wider"
              >
                Commission
              </td>
              <td class="px-6 py-3 border-t border-[#526471] text-[#cbd5e0]">
                {{ summary?.paymentTerms.percent_of_profit }} % of profit
              </td>
              <td class="px-6 py-3 text-right text-white font-medium">
                $ {{ toPayProfit.toFixed(2) }}
              </td>
            </tr>
            <tr>
              <td class="px-6 py-3 border-t border-[#526471] text-[#cbd5e0]">% of direct profit</td>
              <td class="px-6 py-3 text-right text-white font-medium">
                $
                {{
                  (
                    (Number(summary?.orders_profit_direct || 0) *
                      Number(summary?.paymentTerms?.percent_of_profit || 0)) /
                    100
                  ).toFixed(2)
                }}
              </td>
            </tr>

            <!-- Salary/Other Section (ИСПРАВЛЕННЫЙ ROWSPAN) -->
            <tr>
              <td
                :rowspan="
                  1 +
                  (summary?.settlements_total > 0 ? 1 : 0) +
                  (summary?.vacation_amount > 0 ? 1 : 0) +
                  (summary?.missed_days > 0 ? 1 : 0) +
                  (summary?.settlement_fine > 0 ? 1 : 0) +
                  (summary?.advance_amount > 0 ? 1 : 0)
                "
                class="px-6 py-4 font-semibold text-white align-top bg-[#33414b] text-xs uppercase tracking-wider"
              >
                Other
              </td>
              <td class="px-6 py-3 text-[#cbd5e0]">fixed salary</td>
              <td class="px-6 py-3 text-right font-medium text-white">
                $ {{ (summary?.paymentTerms.fixed_salary || 0).toFixed(2) }}
              </td>
            </tr>

            <tr v-if="summary?.settlements_total > 0">
              <td class="px-6 py-3 text-[#cbd5e0] border-t border-[#526471]">settlements</td>
              <td class="px-6 py-3 text-right text-white font-medium">
                $ {{ summary?.settlements_total.toFixed(2) }}
              </td>
            </tr>

            <!-- Новая строка: Fine -->
            <tr v-if="summary?.settlement_fine > 0">
              <td class="px-6 py-3 text-[#f87171] border-t border-[#526471]">fine</td>
              <td class="px-6 py-3 text-right text-[#f87171] font-medium">
                - $ {{ summary?.settlement_fine.toFixed(2) }}
              </td>
            </tr>

            <!-- Новая строка: Advance -->
            <tr v-if="summary?.advance_amount > 0">
              <td class="px-6 py-3 text-[#cbd5e0] border-t border-[#526471]">advance</td>
              <td class="px-6 py-3 text-right text-white font-medium">
                - UZS {{ summary?.advance_amount.toLocaleString() }}
              </td>
            </tr>

            <tr v-if="summary?.vacation_amount > 0">
              <td class="px-6 py-3 text-[#cbd5e0] border-t border-[#526471]">vacation</td>
              <td class="px-6 py-3 text-right text-[#cbd5e0] italic text-xs">
                UZS {{ summary?.vacation_amount.toLocaleString() }}
              </td>
            </tr>

            <tr v-if="summary?.missed_days > 0">
              <td class="px-6 py-3 text-[#cbd5e0] border-t border-[#526471]">missed days</td>
              <td class="px-6 py-3 text-right font-medium text-white">
                {{ summary?.missed_days }}
              </td>
            </tr>

            <!-- Total Payout (ТЕПЕРЬ ТОЧНО ВО ВСЮ ШИРИНУ) -->
            <tr class="bg-[#2a363f] text-white">
              <td colspan="2" class="px-6 py-6 font-bold uppercase tracking-widest">Payout</td>
              <td class="px-6 py-5 text-right font-bold">$ {{ summary?.payout_usd.toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="">
        <Text v-if="summary?.orders_number > 0" bold size="lg" class="mb-4 mt-4">Orders</Text>
      </div>
      <div v-if="summary?.orders_number > 0" class="overflow-clip flex flex-col">
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
        <div class="flex-1 overflow-y-auto max-h-[25vh]">
          <table class="w-full table-fixed">
            <tbody>
              <tr
                v-for="order in sortedOrdersInProgress"
                :key="order.id"
                class="hover:bg-base-200"
                @click="openOrder(order)"
              >
                <td
                  v-for="col in cols"
                  :key="order.id + '_' + col.label"
                  class="py-3 px-4"
                  :style="{ width: col.size + 'px' }"
                >
                  <p
                    class="block antialiasing tracking-wide font-light leading-normal truncate text-gray-500"
                    :style="{ width: col.size + 'px' }"
                  >
                    {{ col.value(order) }}
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
          <table class="w-full table-fixed">
            <tbody>
              <tr
                v-for="order in sortedOrders"
                :key="order.id"
                class="hover:bg-base-200"
                @click="openOrder(order)"
              >
                <td
                  v-for="col in cols"
                  :key="order.id + '_' + col.label"
                  class="py-3 px-4"
                  :style="{ width: col.size + 'px' }"
                  :class="{ 'text-gray-500': order.stage === 3 }"
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
        <div class="mt-3 mb-3">
          <Text v-if="summary?.settlements_total > 0" bold size="lg" class="mb-4">Settlements</Text>
          <Text v-else></Text>
          <div class="flex-1 overflow-y-auto max-h-[15vh]">
            <table
              v-if="summary?.settlements_total > 0"
              class="w-full text-left table-auto min-w-max"
            >
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
                <tr v-for="settlement in props.summary?.settlements || []" :key="settlement.id">
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
      </div>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
