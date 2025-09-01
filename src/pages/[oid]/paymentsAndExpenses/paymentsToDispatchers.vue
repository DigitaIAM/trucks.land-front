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
import { paymentToDispatcherExportToExcel } from '@/utils/export_dispatchers_payments.ts'

const paymentToDispatcherStore = usePaymentToDispatcherStore()
const usersStore = useUsersStore()

defineOptions({
  __loaders: [useOrgData],
})

const state = reactive({})

const selectedDocument = ref<PaymentToDispatcherSummary | null>(null)

function openPayment(record: PaymentToDispatcherSummary) {
  selectedDocument.value = record
}

function onClose() {
  selectedDocument.value = null
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
    label: '#',
    value: (v: PaymentToDispatcherSummary) => v.id,
    size: 50,
  },
  {
    label: 'month',
    value: (v: PaymentToDispatcherSummary) => v.month,
    size: 30,
  },
  {
    label: 'dispatcher',
    value: (v: PaymentToDispatcherSummary) =>
      resolve(
        v,
        'dispatcher_' + v.dispatcher,
        () => ({ name: '_' }),
        () => usersStore.resolve(v.dispatcher),
        (map) => map.real_name,
      ),
    size: 200,
  },
  {
    label: 'order amount',
    value: (v: PaymentToDispatcherSummary) => '$' + v.amount.toFixed(0),
    size: 80,
  },
  {
    label: 'd/payment',
    value: (v: PaymentToDispatcherSummary) => '$' + v.payment.toFixed(0),
    size: 80,
  },
  {
    label: 'to pay',
    value: (v: PaymentToDispatcherSummary) => '$' + v.to_pay.toFixed(0),
    size: 80,
  },
  {
    label: 'created at',
    value: (v: PaymentToDispatcherSummary) => useDateFormat(v.created_at, 'MMM DD'),
    size: 80,
  },
  {
    label: 'created by',
    value: (v: PaymentToDispatcherSummary) =>
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
  <PaymentsForDispatcherOrders
    @closed="onClose"
    :document="selectedDocument"
  ></PaymentsForDispatcherOrders>
  <div class="flex flex-row gap-6 px-4 mb-2 mt-3">
    <Text size="2xl">Payments</Text>
    <Search :store="usersStore"></Search>
    <Button
      class="btn-soft font-light tracking-wider flex"
      @click="paymentToDispatcherExportToExcel(paymentToDispatcherStore.listing!)"
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
      <tr
        v-for="line in paymentToDispatcherStore.listing"
        :key="line.id"
        @click="openPayment(line)"
      >
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
