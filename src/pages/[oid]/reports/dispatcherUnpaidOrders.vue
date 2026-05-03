<route lang="yaml">
# @formatter:off
meta:
  layout: nav-view
</route>

<script lang="ts">
import { defineBasicLoader } from 'unplugin-vue-router/data-loaders/basic'

const organizationsStore = useOrganizationsStore()
const authStore = useAuthStore()
const reportDispatcher = useReportDispatcher()

export const useOrgData = defineBasicLoader(
  'oid',
  async (route) => {
    const org = await organizationsStore.resolve3(route.params.oid)
    authStore.org = org
    await reportDispatcher.loading(org.id)
    // console.table(org)
    return org
  },
  { key: 'org' },
)
</script>

<script setup lang="ts">
import moment from 'moment-timezone'

const reportDispatcherStore = useReportDispatcher()
const usersStore = useUsersStore()

const ts = moment().tz('America/New_York').subtract(3, 'days')
const currentYear = ref(ts.year())
const currentMonth = ref(ts.month() + 1)
const currentDay = ref(moment().tz('America/New_York'))
const exchangeRate = ref<string>('')

defineOptions({
  __loaders: [useOrgData],
})

const state = reactive({})

const selectedRecord = ref<EmployeePaymentRecord | null>(null)

function openPayment(record: EmployeePaymentRecord) {
  selectedRecord.value = record
}

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
    label: 'employee',
    value: (v: EmployeePaymentSummary) =>
      resolve(
        v,
        'employee_' + v.employee,
        () => ({ name: '_' }),
        () => usersStore.resolve(v.employee),
        (map) => map.real_name,
      ),
    size: 200,
  },
  {
    label: 'orders',
    value: (v: EmployeePaymentSummary) =>
      v.orders_in_progress.size > 0 || v.orders_number > 0
        ? v.orders_number + ' / ' + v.orders_in_progress.size
        : '',
    size: 100,
  },
  {
    label: 'cost of orders',
    value: (v: EmployeePaymentSummary) =>
      v.orders.size == 0 ? '' : '$' + (Number(v.orders_amount) || 0).toFixed(0),
    size: 100,
  },
  {
    label: 'd/payments',
    value: (v: EmployeePaymentSummary) =>
      v.orders_driver == 0 ? '' : '$' + (Number(v.orders_driver) || 0).toFixed(0),
    size: 100,
  },
  {
    label: 'profit',
    value: (v: EmployeePaymentSummary) =>
      v.orders_profit == 0 ? '' : '$' + (Number(v.orders_profit) || 0).toFixed(0),
    size: 100,
  },
  {
    label: 'direct profit',
    value: (v: EmployeePaymentSummary) =>
      v.orders_profit_direct == 0 ? '' : '$' + (Number(v.orders_profit_direct) || 0).toFixed(0),
    size: 100,
  },
  {
    label: 'fixed salary',
    value: (v: EmployeePaymentSummary) =>
      v.paymentTerms.fixed_salary == null ? '' : '$' + v.paymentTerms.fixed_salary || '',
    size: 100,
  },
  {
    label: 'reward',
    value: (v: EmployeePaymentSummary) =>
      v.settlements_total == 0 ? '' : '$' + v.settlements_total,
    size: 80,
  },
  {
    label: 'fine',
    value: (v: EmployeePaymentSummary) => (v.settlement_fine == 0 ? '' : '$' + v.settlement_fine),
    size: 80,
  },
  {
    label: 'to pay',
    value: (v: EmployeePaymentSummary) => '$' + v.payout.toFixed(0),
    size: 100,
  },
  {
    label: 'vacation uzs',
    value: (v: EmployeePaymentSummary) => {
      const formatted = new Intl.NumberFormat('ru-RU').format(v.vacation_amount)
      return v.vacation_amount == 0 ? '' : formatted
    },
    size: 100,
  },
]

async function createPayment() {
  // console.log('exchangeRate', exchangeRate.value)

  const rate = Number(exchangeRate.value)

  //console.log('rate', rate)

  await reportDispatcherStore.createPayment(
    authStore.org?.id,
    currentYear.value,
    currentMonth.value,
    rate,
  )
}
</script>

<template>
  <DispatcherPayment :summary="selectedRecord" />

  <Text class="px-4" size="2xl">Unpaid commissions and salaries</Text>
  <div class="flex flex-row items-center gap-6 px-4 mb-2 mt-3">
    <SearchVue :store="reportDispatcherStore"></SearchVue>
    <Text>{{ currentDay.format('L') }}</Text>
    <template v-if="authStore.account?.access.is_payroll_accountant === true">
      <TextInput v-model="exchangeRate" placeholder="$ exchange rate"></TextInput>
      <Button
        :disabled="reportDispatcherStore.employees.length == 0"
        class="btn-soft font-light tracking-wider"
        @click="createPayment()"
        >Close month</Button
      >
    </template>
  </div>

  <!--  v-if="access?.is_payroll_accountant === true"-->

  <table class="w-full mt-6 text-left table-auto min-w-max">
    <thead>
      <tr
        class="text-sm text-gray-700 uppercase dark:text-gray-400 border-b dark:border-gray-700 border-gray-200"
      >
        <th
          v-for="col in cols"
          :key="'head_' + col.label"
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
      <tr
        v-for="(summary, index) in reportDispatcherStore.employees"
        :key="summary.employee || index"
        class="hover:bg-base-200"
        @click="openPayment(summary)"
      >
        <td
          v-for="(col, colIndex) in cols"
          :key="'row_' + col.label + '_' + (summary.employee || colIndex)"
          class="py-3 px-4"
          :style="{ width: col.size + 'px' }"
        >
          <p
            class="block antialiasing tracking-wide font-light leading-normal truncate"
            :style="{ width: col.size + 'px' }"
          >
            {{ col.value(summary) }}
          </p>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped></style>
