<route lang="yaml">
# @formatter:off
meta:
  layout: nav-view
</route>

<script lang="ts">
import { defineBasicLoader } from 'unplugin-vue-router/data-loaders/basic'

const organizationsStore = useOrganizationsStore()
const authStore = useAuthStore()

export const useOrgData = defineBasicLoader(
  'oid',
  async (route) => {
    const org = await organizationsStore.resolve3(route.params.oid)
    authStore.org = org
    return org
  },
  { key: 'org' },
)
</script>

<script setup lang="ts">
import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import dayjs from 'dayjs'
import DispatcherOrdersForMonth from '@/components/modal/DispatcherOrdersForMonth.vue'
import { dispatcherPerformanceExportToExcel } from '@/utils/dispatcherPerformanceToExcel.ts'
import moment from 'moment-timezone'

const reportDispatcherStore = useReportDispatcher()
const usersStore = useUsersStore()

const currentDay = ref(moment().tz('America/New_York'))

const dateFrom = ref<Date>(dayjs().startOf('month').toDate())
const dateTo = ref<Date>(dayjs().toDate())

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
    label: 'dispatcher',
    value: (v: EmployeePaymentSummary) =>
      resolve(
        v,
        () => ({ name: '?' }),
        () => usersStore.resolve(v.employee),
        (map) => map.name,
      ),
    size: 200,
  },
  {
    label: 'orders',
    value: (v: EmployeePaymentSummary) => v.orders_number,
    size: 100,
  },
  {
    label: 'profit',
    value: (v: EmployeePaymentSummary) => '$' + v.orders_profit.toFixed(0),
    size: 100,
  },
]

async function loadReport() {
  if (!authStore.org?.id) return
  const from = dayjs(dateFrom.value).format('YYYY-MM-DD')
  const to = dayjs(dateTo.value).format('YYYY-MM-DD')
  await reportDispatcherStore.loadPerformanceReport(authStore.org.id, from, to)
}

watch([dateFrom, dateTo], () => {
  loadReport()
})

onMounted(() => {
  loadReport()
})
</script>

<template>
  <DispatcherOrdersForMonth :summary="selectedRecord" />

  <div class="flex flex-row items-center gap-6 px-4 mb-2 mt-3">
    <VueDatePicker v-model="dateFrom" :enable-time-picker="false" />
    <Text>—</Text>
    <VueDatePicker v-model="dateTo" :enable-time-picker="false" />
    <SearchVue :store="reportDispatcherStore"></SearchVue>
    <Text>{{ currentDay.format('L') }}</Text>
    <Button
      class="btn-soft font-light tracking-wider"
      @click="dispatcherPerformanceExportToExcel(reportDispatcherStore.employees!, reportDispatcherStore.dateFrom, reportDispatcherStore.dateTo)"
      >Excel</Button
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
