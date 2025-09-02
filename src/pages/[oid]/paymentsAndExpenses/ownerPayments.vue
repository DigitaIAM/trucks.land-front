<route lang="yaml">
# @formatter:off
meta:
  layout: nav-view
</route>

<script lang="ts">
import { defineBasicLoader } from 'unplugin-vue-router/data-loaders/basic'

const organizationsStore = useOrganizationsStore()
const authStore = useAuthStore()
const ordersStore = useOrdersStore()

export const useOrgData = defineBasicLoader(
  'oid',
  async (route) => {
    const org = await organizationsStore.resolve3(route.params.oid)
    authStore.org = org
    await ordersStore.setContext([{ key: 'organization', val: org.id } as KV])
    // console.table(org)
    return org
  },
  { key: 'org' },
)
</script>

<script setup lang="ts">
import { weekExportToExcel } from '@/utils/export_week_orders.ts'
import moment from 'moment/moment'
const paymentToOwnerStore = usePaymentToOwnerStore()
const ownersStore = useOwnersStore()
const usersStore = useUsersStore()

const ts = moment().subtract(3, 'days')
const currentYear = ref(ts.year())
const currentWeek = ref(ts.isoWeek())

const selectedDocument = ref<PaymentToOwnerSummary | null>(null)

defineOptions({
  __loaders: [useOrgData],
})

function openPayment(record: PaymentToOwnerSummary) {
  selectedDocument.value = record
}

function onClose() {
  selectedDocument.value = null
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
    value: (v: PaymentToOwnerSummary) => v.id,
    size: 40,
  },
  {
    label: 'week',
    value: (v: PaymentToOwnerSummary) => v.week,
    size: 40,
  },
  {
    label: 'owner',
    value: (v: PaymentToOwnerSummary) =>
      resolve(
        v,
        'owner_' + v.owner,
        () => ({ name: '-' }),
        () => ownersStore.resolve(v.owner),
        (map) => map.name,
      ),
    size: 300,
  },
  {
    label: 'order amount',
    value: (v: PaymentToOwnerSummary) => '$' + v.orders,
    size: 100,
  },
  {
    label: 'order payment',
    value: (v: PaymentToOwnerSummary) => '$' + v.payment,
    size: 100,
  },
  {
    label: 'expenses',
    value: (v: PaymentToOwnerSummary) => '$' + v.expenses,
    size: 100,
  },
  {
    label: 'payout',
    value: (v: PaymentToOwnerSummary) => '$' + v.payout,
    size: 100,
  },
  {
    label: 'created at',
    value: (v: PaymentToOwnerSummary) => useDateFormat(v.created_at, 'MMM DD'),
    size: 75,
  },
  {
    label: 'created by',
    value: (v: PaymentToOwnerSummary) =>
      resolve(
        v,
        'created_by' + v.created_by,
        () => ({ name: '-' }),
        () => usersStore.resolve(v.created_by),
        (map) => map.name,
      ),
    size: 150,
  },
]
</script>

<template>
  <PaymentsForOwnerOrders :document="selectedDocument" @closed="onClose" />
  <div class="flex flex-row items-center gap-6 px-4 mb-2 mt-3">
    <Text size="2xl">Payments</Text>
    <Search :store="ownersStore"></Search>
    <div>#{{ currentWeek }}</div>
    <div>{{ currentYear }}</div>
    <Button
      class="btn-soft font-light tracking-wider ml-6"
      @click="weekExportToExcel(paymentToOwnerStore.listing)"
      >Excel
    </Button>
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
      <tr v-for="line in paymentToOwnerStore.listing" :key="line.id" @click="openPayment(line)">
        <td
          v-for="col in cols"
          :key="'row_' + col.label + '_' + line.id"
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
