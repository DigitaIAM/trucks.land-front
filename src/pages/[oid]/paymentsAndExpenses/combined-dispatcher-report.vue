<route lang="yaml">
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
import { combinedDispatcherReportExportToExcel } from '@/utils/export_combined_dispatcher_report_to_excel.ts'
import type { ExcelRecord } from '@/utils/export_combined_dispatcher_report_to_excel.ts'
import type { SettlementEmployee } from '@/stores/employee_settlements.ts'
import type { PaymentToEmployeeSummary } from '@/stores/employee_payments.ts'
import moment from 'moment-timezone'

const ORGANIZATION_CODES = ['CNU', 'CVS', 'CAF']

const organizationsStore = useOrganizationsStore()
const paymentToEmployeeStore = usePaymentToEmployeeStore()
const usersStore = useUsersStore()

defineOptions({
  __loaders: [useOrgData],
})

interface MergedReportRecord {
  employee: number
  employeeName: string
  fixed_salary: number
  to_pay: number
  settlement_bonus: number
  settlement_premium: number
  settlement_fine: number
  settlement_vacation: number
  settlement_advance: number
  payout_usd: number
}

const currentYear = ref(moment().year())
const currentMonth = ref(moment().month() + 1)
const searchQuery = ref('')
const mergedData = ref<MergedReportRecord[]>([])
const loading = ref(false)
const cnuExRate = ref(0)

const years = [2025, 2026]

const exRateAvailable = computed(() => cnuExRate.value > 0)

async function loadData() {
  loading.value = true
  mergedData.value = []
  cnuExRate.value = 0

  const orgs = (
    await Promise.all(ORGANIZATION_CODES.map((code) => organizationsStore.resolve3(code)))
  ).filter(Boolean)

  const cnuOrg = orgs.find((o) => o.code3 === 'CNU')

  const typeStore = useEmployeeSettlementsTypeStore()
  await typeStore.initialized
  const typeMap = new Map<number, string>()
  for (const t of typeStore.listing ?? []) {
    typeMap.set(t.id, t.settlement_type.toLowerCase().trim())
  }

  const allRecords: Array<
    Omit<PaymentToEmployeeSummary, 'settlements'> & { settlements: SettlementEmployee[] }
  > = []

  for (const org of orgs) {
    const journalData = await paymentToEmployeeStore.fetchJournalData(
      org.id,
      currentYear.value,
      currentMonth.value,
    )

    const typed = (journalData || []) as PaymentToEmployeeSummary[]

    if (!cnuExRate.value && org.id === cnuOrg?.id) {
      for (const record of typed) {
        const rate = Number(record.ex_rate) || 0
        if (rate > 0) {
          cnuExRate.value = rate
          break
        }
      }
    }

    for (const record of typed) {
      const { data: settlementLinks } = await supabase
        .from('employee_payment_settlements')
        .select('*, settlement:employee_settlements(*)')
        .eq('doc_payment', record.id)

      const settlements: SettlementEmployee[] = []
      settlementLinks?.forEach((json) => {
        const link = json as { settlement: SettlementEmployee }
        if (link.settlement) {
          settlements.push(link.settlement)
        }
      })

      const { settlements: _s, ...recordRest } = record
      allRecords.push({ ...recordRest, settlements })
    }
  }

  const merged = new Map<number, MergedReportRecord>()

  for (const record of allRecords) {
    const empId = record.employee

    let bonus = 0
    let premium = 0
    let fine = 0
    let vacation = 0
    let advance = 0
    for (const s of record.settlements || []) {
      const typeName = typeMap.get(Number(s.settlement_type)) || ''
      const amount = Number(s.amount) || 0
      if (typeName === 'fine') {
        fine += amount
      } else if (typeName === 'vacation pay') {
        vacation += amount
      } else if (typeName === 'advance') {
        advance += amount
      } else if (typeName === 'premium') {
        premium += amount
      } else {
        bonus += amount
      }
    }

    const existing = merged.get(empId)
    if (existing) {
      existing.fixed_salary += Number(record.fixed_salary) || 0
      existing.to_pay += Number(record.to_pay) || 0
      existing.settlement_bonus += bonus
      existing.settlement_premium += premium
      existing.settlement_fine += fine
      existing.settlement_vacation += vacation
      existing.settlement_advance += advance
      existing.payout_usd += Number(record.payout_usd) || 0
    } else {
      const user = await usersStore.resolve(empId)

      merged.set(empId, {
        employee: empId,
        employeeName: user?.real_name || `ID: ${empId}`,
        fixed_salary: Number(record.fixed_salary) || 0,
        to_pay: Number(record.to_pay) || 0,
        settlement_bonus: bonus,
        settlement_premium: premium,
        settlement_fine: fine,
        settlement_vacation: vacation,
        settlement_advance: advance,
        payout_usd: Number(record.payout_usd) || 0,
      })
    }
  }

  mergedData.value = Array.from(merged.values()).sort((a, b) =>
    a.employeeName.localeCompare(b.employeeName, 'en', { sensitivity: 'base' }),
  )

  loading.value = false
}

const filteredData = computed(() => {
  const str = searchQuery.value?.toLowerCase().trim()
  if (!str) return mergedData.value
  return mergedData.value.filter((r) => r.employeeName.toLowerCase().includes(str))
})

async function handleExport() {
  const excelData: ExcelRecord[] = filteredData.value.map((r) => ({
    employeeName: r.employeeName,
    fixed_salary: r.fixed_salary,
    to_pay: r.to_pay,
    settlement_bonus: r.settlement_bonus,
    settlement_premium: r.settlement_premium,
    settlement_fine: r.settlement_fine,
    settlement_vacation: r.settlement_vacation,
    settlement_advance: r.settlement_advance,
    payout_usd: r.payout_usd,
  }))

  await combinedDispatcherReportExportToExcel(
    excelData,
    cnuExRate.value,
    currentYear.value,
    currentMonth.value,
  )
}

watch([currentYear, currentMonth], () => {
  loadData()
})

loadData()
</script>

<template>
  <Text class="px-4" size="2xl">Combined employee report</Text>
  <div class="flex items-center justify-between w-full gap-4">
    <div class="flex items-center gap-3 w-full px-4">
      <select v-model="currentYear" class="select select-bordered select-sm">
        <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
      </select>

      <select v-model="currentMonth" class="select select-bordered select-sm">
        <option v-for="m in 12" :key="m" :value="m">
          {{ m }}
        </option>
      </select>

      <div
        class="flex items-center px-2 py-2 group hover:ring-1 hover:ring-gray-200 focus-within:ring-2 ring-inset focus-within:ring-blue-500 rounded-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="mr-2 size-5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
        <input
          v-model="searchQuery"
          class="block appearance-none bg-transparent text-base focus:outline-none"
          placeholder="Search employee"
          type="text"
        />
      </div>
    </div>

    <div class="flex items-center gap-3 mr-6">
      <span v-if="exRateAvailable" class="text-sm text-gray-500"
        >1 USD exchange rate: {{ new Intl.NumberFormat('ru-RU').format(cnuExRate) }} UZS</span
      >
      <Button
        class="btn-soft font-light tracking-wider"
        :disabled="filteredData.length === 0 || !exRateAvailable"
        @click="handleExport"
      >
        Export Excel
      </Button>
    </div>
  </div>

  <div v-if="loading" class="px-4">
    <Text>Loading...</Text>
  </div>

  <table v-else class="w-full mt-6 text-left table-auto min-w-max">
    <thead>
      <tr
        class="text-sm text-gray-700 uppercase dark:text-gray-400 border-b dark:border-gray-700 border-gray-200"
      >
        <th class="p-4" style="width: 30px">
          <p class="block antialiasing tracking-wider font-thin leading-none">#</p>
        </th>
        <th class="p-4" style="width: 200px">
          <p class="block antialiasing tracking-wider font-thin leading-none">employee</p>
        </th>
        <th class="p-4" style="width: 100px">
          <p class="block antialiasing tracking-wider font-thin leading-none">fixed salary</p>
        </th>
        <th class="p-4" style="width: 100px">
          <p class="block antialiasing tracking-wider font-thin leading-none">commission</p>
        </th>
        <th class="p-4" style="width: 100px">
          <p class="block antialiasing tracking-wider font-thin leading-none">bonus</p>
        </th>
        <th class="p-4" style="width: 100px">
          <p class="block antialiasing tracking-wider font-thin leading-none">premium</p>
        </th>
        <th class="p-4" style="width: 80px">
          <p class="block antialiasing tracking-wider font-thin leading-none">fine</p>
        </th>
        <th class="p-4" style="width: 100px">
          <p class="block antialiasing tracking-wider font-thin leading-none">payout USD</p>
        </th>
        <th class="p-4" style="width: 100px">
          <p class="block antialiasing tracking-wider font-thin leading-none">vacation UZS</p>
        </th>
        <th class="p-4" style="width: 100px">
          <p class="block antialiasing tracking-wider font-thin leading-none">advance UZS</p>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(row, index) in filteredData" :key="row.employee" class="hover:bg-base-200">
        <td class="py-3 px-4">
          <p class="block antialiasing tracking-wide font-light leading-normal">{{ index + 1 }}</p>
        </td>
        <td class="py-3 px-4">
          <p class="block antialiasing tracking-wide font-light leading-normal">
            {{ row.employeeName }}
          </p>
        </td>
        <td class="py-3 px-4">
          <p class="block antialiasing tracking-wide font-light leading-normal">
            {{ row.fixed_salary ? '$' + row.fixed_salary.toFixed(0) : '' }}
          </p>
        </td>
        <td class="py-3 px-4">
          <p class="block antialiasing tracking-wide font-light leading-normal">
            {{ row.to_pay ? '$' + row.to_pay.toFixed(0) : '' }}
          </p>
        </td>
        <td class="py-3 px-4">
          <p class="block antialiasing tracking-wide font-light leading-normal">
            {{ row.settlement_bonus ? '$' + row.settlement_bonus.toFixed(0) : '' }}
          </p>
        </td>
        <td class="py-3 px-4">
          <p class="block antialiasing tracking-wide font-light leading-normal">
            {{ row.settlement_premium ? '$' + row.settlement_premium.toFixed(0) : '' }}
          </p>
        </td>
        <td class="py-3 px-4">
          <p class="block antialiasing tracking-wide font-light leading-normal">
            {{ row.settlement_fine ? '$' + row.settlement_fine.toFixed(0) : '' }}
          </p>
        </td>
        <td class="py-3 px-4">
          <p class="block antialiasing tracking-wide font-light leading-normal">
            ${{ row.payout_usd.toFixed(0) }}
          </p>
        </td>
        <td class="py-3 px-4">
          <p class="block antialiasing tracking-wide font-light leading-normal">
            {{
              row.settlement_vacation
                ? new Intl.NumberFormat('ru-RU').format(row.settlement_vacation)
                : ''
            }}
          </p>
        </td>
        <td class="py-3 px-4">
          <p class="block antialiasing tracking-wide font-light leading-normal">
            {{
              row.settlement_advance
                ? new Intl.NumberFormat('ru-RU').format(row.settlement_advance)
                : ''
            }}
          </p>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped></style>
