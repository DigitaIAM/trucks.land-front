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

const selectedDispatcher = ref(null)

function openPayment(record: DispatcherPaymentRecord) {
  selectedDispatcher.value = record.dispatcher
}

function resolve(
  summary: DispatcherPaymentSummary,
  create: () => object,
  request: () => Promise<object | null>,
  label: (obj: object) => string,
) {
  let s = state[summary.dispatcher]
  if (s) {
    return label(s)
  } else {
    s = create()
    state[summary.dispatcher] = s
    request().then((obj) => {
      state[summary.dispatcher] = obj
    })
    return label(s)
  }
}

const cols = [
  {
    label: 'dispatcher',
    value: (v: DispatcherPaymentSummary) =>
      resolve(
        v,
        () => ({ name: '?' }),
        () => usersStore.resolve(v.dispatcher),
        (map) => map.real_name,
      ),
    size: 200,
  },
  {
    label: 'orders',
    value: (v: DispatcherPaymentSummary) => v.orders_number,
    size: 100,
  },
  {
    label: 'cost of orders',
    value: (v: DispatcherPaymentSummary) => '$' + v.orders_amount.toFixed(0),
    size: 100,
  },
  {
    label: 'd/payments',
    value: (v: DispatcherPaymentSummary) => '$' + v.orders_driver.toFixed(0),
    size: 100,
  },
  {
    label: '% of gross',
    value: (v: DispatcherPaymentSummary) => v.paymentTerms.percent_of_gross,
    size: 100,
  },
  {
    label: 'to pay',
    value: (v: DispatcherPaymentSummary) => '$' + v.toPayment.toFixed(0),
    size: 100,
  },
  {
    label: 'additionally',
    value: (v: DispatcherPaymentSummary) => '$' + v.additional_payments_total,
    size: 80,
  },
]

async function createPayment() {
  const account = authStore.account
  if (account == null) return

  console.log('exchangeRate', exchangeRate.value)

  const rate = Number(exchangeRate.value)

  console.log('rate', rate)

  await reportDispatcherStore.createPayment(
    authStore.org?.id,
    currentYear.value,
    currentMonth.value,
    account,
    rate,
  )
}
</script>

<template>
  <DispatcherPayment :dispatcher-id="selectedDispatcher"></DispatcherPayment>
  <div class="flex flex-row items-center gap-6 px-4 mb-2 mt-3">
    <Text size="2xl">Report</Text>
    <SearchVue :store="usersStore"></SearchVue>
    <Text>{{ currentDay.format('L') }}</Text>
    <TextInput v-model="exchangeRate" placeholder="Ex rate"></TextInput>
    <Button
      :disabled="reportDispatcherStore.dispatchers.length == 0"
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
        v-for="line in reportDispatcherStore.dispatchers"
        :key="line.dispatcher"
        @click="openPayment(line)"
      >
        <td
          v-for="col in cols"
          :key="'row_' + col.label + '_' + line.dispatcher"
          class="py-3 px-4"
          :style="{ width: col.size + 'px' }"
        >
          <p
            class="block antialiasing tracking-wide font-light leading-normal truncate"
            :style="{ width: col.size + 'px' }"
          >
            {{ col.value(line) }}
          </p>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped></style>
