<route lang="yaml">
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
    ordersStore.setContext([{ key: 'organization', val: org.id } as KV])
    // console.table(org)
    return org
  },
  { key: 'org' },
)
</script>

<script setup lang="ts">
import { type User, useUsersStore } from '@/stores/users.ts'
import { type DispatcherPaymentSummary, useReportDispatcher } from '@/stores/report_dispatcher.ts'

const reportDispatcherStore = useReportDispatcher()
const usersStore = useUsersStore()

defineOptions({
  __loaders: [useOrgData],
})

const state = reactive({})

const selectedDispatcher = ref(null)

function openPayment(record: DispatcherPaymentRecord) {
  selectedDispatcher.value = record.dispatcher
}

function onClose() {
  selectedDispatcher.value = null
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
    label: 'Dispatcher',
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
    label: 'Orders',
    value: (v: DispatcherPaymentSummary) => v.orders_number,
    size: 100,
  },
  {
    label: 'Amount',
    value: (v: DispatcherPaymentSummary) => '$' + v.orders_amount,
    size: 100,
  },
  {
    label: 'Profit',
    value: (v: DispatcherPaymentSummary) => '$' + v.orders_profit,
    size: 100,
  },
  {
    label: 'To pay',
    value: (v: DispatcherPaymentSummary) => v.toPayment,
    size: 100,
  },
  // {
  //   label: 'Created at',
  //   value: (v: DispatcherPaymentSummary) => v.created_at,
  //   size: 200,
  // },
  // {
  //   label: 'Note',
  //   value: (v: DispatcherPaymentSummary) => v.note,
  //   size: 200,
  // },
  // {
  //   label: 'Created by',
  //   value: (v: DispatcherPaymentSummary) => v.created_by,
  //   size: 150,
  // },
]
</script>

<template>
  <DispatcherPayment :dispatcher-id="selectedDispatcher" @closed="onClose"></DispatcherPayment>
  <div class="flex flex-row gap-6 px-4 mb-2 mt-3">
    <Text size="2xl">Payments to dispatchers</Text>
    <Search store=""></Search>
<!--    <Button class="btn-accent">Create</Button>-->
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
        v-for="order in reportDispatcherStore.dispatchers"
        :key="order.dispatcher"
        @click="openPayment(order)"
      >
        <td
          v-for="col in cols"
          :key="'row_' + col.label + '_' + order.dispatcher"
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
</template>

<style scoped></style>
