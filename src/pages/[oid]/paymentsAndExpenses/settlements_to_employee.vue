<route lang="yaml">
# @formatter:off
meta:
  layout: nav-view
</route>

<script lang="ts">
import { defineBasicLoader } from 'unplugin-vue-router/data-loaders/basic'
import type { KV } from '@/utils/kv.ts'
import moment from 'moment-timezone'

const organizationsStore = useOrganizationsStore()
const authStore = useAuthStore()
const settlementsEmployeeStore = useSettlementsEmployeeStore()

export const useOrgData = defineBasicLoader(
  'oid',
  async (route) => {
    const org = await organizationsStore.resolve3(route.params.oid)
    authStore.org = org
    await settlementsEmployeeStore.setContext([{ key: 'organization', val: org.id } as KV])
    return org
  },
  { key: 'org' },
)
</script>

<script setup lang="ts">
const usersStore = useUsersStore()
const settlementsEmployeeStore = useSettlementsEmployeeStore()
const employeeSettlementsTypeStore = useEmployeeSettlementsTypeStore()

const selectedDocument = ref<SettlementEmployee | null>(null)
const selectedTypes = ref<Array<EmployeeSettlementsType> | null>(null)
const allowEmployeeSelection = ref<boolean>(false)

const filters = ref<Array<KV>>([])

defineOptions({
  __loaders: [useOrgData],
})

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
    value: (v: SettlementEmployee) => v.id,
    size: 30,
  },
  {
    label: 'created at',
    value: (v: SettlementEmployee) => useDateMyFormat(v.created_at),
    size: 120,
  },
  {
    label: 'employee',
    value: (v: SettlementEmployee) =>
      resolve(
        v,
        'employee_' + v.employee,
        () => ({ name: '-' }),
        () => usersStore.resolve(v.employee),
        (map) => map.real_name,
      ),
    size: 200,
  },
  {
    label: 'payment type',
    value: (v: SettlementEmployee) =>
      resolve(
        v,
        'settlement_type_' + v.settlement_type,
        () => ({ name: '-' }),
        () => employeeSettlementsTypeStore.resolve(v.settlement_type),
        (map) => map.settlement_type,
      ),
    size: 100,
  },
  {
    label: 'amount',
    value: (v: SettlementEmployee) => v.amount + ' ' + v.currency,
    size: 100,
  },
  {
    label: 'created by',
    value: (v: SettlementEmployee) =>
      resolve(
        v,
        'created_by_' + v.created_by,
        () => ({ name: '-' }),
        () => usersStore.resolve(v.created_by),
        (map) => map.real_name,
      ),
    size: 200,
  },
]

function openSettlement(settlement: SettlementEmployee) {
  allowEmployeeSelection.value = false
  selectedTypes.value = employeeSettlementsTypeStore.listing
  selectedDocument.value = settlement
}

function onClose() {
  allowEmployeeSelection.value = false
  selectedTypes.value = null
  selectedDocument.value = null
}

function createSettlement() {
  allowEmployeeSelection.value = true
  selectedTypes.value = employeeSettlementsTypeStore.listing

  const advanceTypeObject = employeeSettlementsTypeStore.listing.find(
    (t) => t.settlement_type === 'advance',
  )

  selectedDocument.value = {
    organization: authStore.org?.id || 0,
    settlement_type: advanceTypeObject || null,
    currency: 'UZS',
    amount: null,
    employee: null,
    notes: '',
  } as unknown as SettlementEmployee
}

function setFilter(key: string, val: any) {
  const index = filters.value.findIndex((v) => v.key === key)
  if (index < 0) {
    filters.value.push({ key: key, val: val } as KV)
  } else {
    filters.value[index] = { key: key, val: val } as KV
  }

  if (key === 'month') {
    const now = moment().tz('America/New_York')
    const year = val.id > now.month() ? now.year() - 1 : now.year()

    const nkey = 'year'
    const nval = { id: year, name: `${year}` }

    const nindex = filters.value.findIndex((v) => v.key === nkey)
    if (nindex < 0) {
      filters.value.push({ key: nkey, val: nval } as KV)
    } else {
      filters.value[nindex] = { key: nkey, val: nval } as KV
    }
  }

  _applyFilters()
}

function delFilter(key: string) {
  const index = filters.value.findIndex((v) => v.key === key)
  if (index >= 0) {
    filters.value.splice(index, 1)
  }

  _applyFilters()
}

function _applyFilters() {
  const resolved: Array<KV> = []

  const monthFilter = filters.value.find((v) => v.key === 'month')
  const yearFilter = filters.value.find((v) => v.key === 'year')

  if (monthFilter && yearFilter) {
    const month = typeof monthFilter.val === 'object' ? monthFilter.val.id : parseInt(monthFilter.val)
    const year = typeof yearFilter.val === 'object' ? yearFilter.val.id : parseInt(yearFilter.val)

    const start = moment({ year, month: month - 1, day: 1 }).startOf('month').toISOString()
    const end = moment({ year, month: month - 1, day: 1 }).endOf('month').add(1, 'day').toISOString()

    resolved.push({ key: 'created_at_range', val: { start, end } } as KV)
  } else if (monthFilter) {
    const month = typeof monthFilter.val === 'object' ? monthFilter.val.id : parseInt(monthFilter.val)
    const now = moment()
    const year = month > now.month() + 1 ? now.year() - 1 : now.year()

    const start = moment({ year, month: month - 1, day: 1 }).startOf('month').toISOString()
    const end = moment({ year, month: month - 1, day: 1 }).endOf('month').add(1, 'day').toISOString()

    resolved.push({ key: 'created_at_range', val: { start, end } } as KV)
  } else if (yearFilter) {
    const year = typeof yearFilter.val === 'object' ? yearFilter.val.id : parseInt(yearFilter.val)

    const start = moment({ year }).startOf('year').toISOString()
    const end = moment({ year }).endOf('year').add(1, 'day').toISOString()

    resolved.push({ key: 'created_at_range', val: { start, end } } as KV)
  }

  const employeeFilter = filters.value.find((v) => v.key === 'employee')
  if (employeeFilter) {
    resolved.push(employeeFilter)
  }

  settlementsEmployeeStore.setFilters(resolved)
}

function capitalizeFirstLetter(val: any) {
  return String(val).charAt(0).toUpperCase() + String(val).slice(1)
}
</script>

<template>
  <SettlementEmployeeModal
    :edit="selectedDocument"
    @closed="onClose"
    :types="selectedTypes"
    :allowEmployeeSelection="allowEmployeeSelection"
  ></SettlementEmployeeModal>
  <div class="flex justify-between items-center w-full mb-4 mt-4">
    <Text size="2xl" class="px-4">Adjustments</Text>
    <Button class="btn-soft font-light tracking-wider mr-4" @click="createSettlement"
      >Create</Button
    >
  </div>
  <div class="flex flex-row gap-6 px-4 mb-2 mt-3">
    <SearchForPaymentsDispatcher @selected="setFilter"></SearchForPaymentsDispatcher>
  </div>
  <div class="flex flex-row gap-6 px-4 mt-3">
    <Badge lg ghost v-for="filter in filters" :key="filter.key" @click="delFilter(filter.key)">
      <div class="font-thin tracking-wider text-sm text-gray-700 uppercase dark:text-gray-400">
        {{ capitalizeFirstLetter(filter.key) }}:
      </div>
      <div>{{ filter.key === 'employee' ? filter.val.real_name : filter.val.name }}</div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="0.5"
        stroke="currentColor"
        class="size-4"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
      </svg>
    </Badge>
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
        v-for="settlement in settlementsEmployeeStore.listing"
        :key="settlement.id"
        class="hover:bg-base-200"
        @click="openSettlement(settlement)"
      >
        <td
          v-for="col in cols"
          :key="'row_' + col.label + '_' + settlement"
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
</template>

<style scoped></style>
