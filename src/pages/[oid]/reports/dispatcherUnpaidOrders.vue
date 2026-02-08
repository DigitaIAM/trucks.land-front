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
import moment from 'moment/moment'

const reportDispatcherStore = useReportDispatcher()
const usersStore = useUsersStore()

const ts = moment().subtract(3, 'days')
const currentYear = ref(ts.year())
const currentMonth = ref(ts.month() + 1)
const currentDay = ref(moment())
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
  order: EmployeePaymentSummary,
  create: () => object,
  request: () => Promise<object | null>,
  label: (obj: object) => string,
) {
  let s = state[order.employee]
  if (s) {
    return label(s)
  } else {
    s = create()
    state[order.employee] = s
    request().then((obj) => {
      state[order.employee] = obj
    })
    return label(s)
  }
}

const cols = [
  {
    label: 'employee',
    value: (v: EmployeePaymentSummary) =>
      resolve(
        v,
        () => ({ name: '?' }),
        () => usersStore.resolve(v.employee),
        (map) => map.real_name,
      ),
    size: 200,
  },
  {
    label: 'orders',
    value: (v: EmployeePaymentSummary) => v.orders_number,
    size: 100,
  },
  {
    label: 'cost of orders',
    value: (v: EmployeePaymentSummary) => '$' + v.orders_amount.toFixed(0),
    size: 100,
  },
  {
    label: 'd/payments',
    value: (v: EmployeePaymentSummary) => '$' + v.orders_driver.toFixed(0),
    size: 100,
  },
  {
    label: 'profit',
    value: (v: EmployeePaymentSummary) => '$' + v.orders_profit.toFixed(0),
    size: 100,
  },
  // {
  //   label: 'gross %',
  //   value: (v: EmployeePaymentSummary) => v.paymentTerms.percent_of_gross,
  //   size: 100,
  // },
  // {
  //   label: 'profit %',
  //   value: (v: EmployeePaymentSummary) => v.paymentTerms.percent_of_profit,
  //   size: 100,
  // },
  {
    label: 'settlements',
    value: (v: EmployeePaymentSummary) => '$' + v.settlements_total,
    size: 80,
  },
  {
    label: 'to pay',
    value: (v: EmployeePaymentSummary) => '$' + v.payout.toFixed(0),
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

  <Text class="px-4" size="2xl">Unpaid orders</Text>
  <div class="flex flex-row items-center gap-6 px-4 mb-2 mt-3">
    <SearchVue :store="reportDispatcherStore"></SearchVue>
    <Text>{{ currentDay.format('L') }}</Text>
    <TextInput v-model="exchangeRate" placeholder="Ex rate"></TextInput>
    <Button
      :disabled="reportDispatcherStore.employees.length == 0"
      class="btn-soft font-light tracking-wider"
      @click="createPayment()"
      >Close month</Button
    >
  </div>
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
        v-for="summary in reportDispatcherStore.employees"
        :key="summary.employee"
        class="hover:bg-base-200"
        @click="openPayment(summary)"
      >
        <td
          v-for="col in cols"
          :key="'row_' + col.label + '_' + summary.employee"
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
