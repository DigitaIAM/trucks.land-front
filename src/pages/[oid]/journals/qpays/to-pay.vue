<route lang="yaml">
# @formatter:off
meta:
  layout: nav-view
</route>

<script lang="ts">
import { defineBasicLoader } from 'unplugin-vue-router/data-loaders/basic'
import type { KV } from '@/utils/kv.ts'

const organizationsStore = useOrganizationsStore()
const authStore = useAuthStore()
const quickPaysStore = useQuickPaysStore()

export const useOrgData = defineBasicLoader(
  'oid',
  async (route) => {
    const org = await organizationsStore.resolve3(route.params.oid)
    authStore.org = org
    await quickPaysStore.setContext([
      { key: 'organization', val: org.id } as KV,
      { key: 'qp_stage', val: 12 },
    ])
    return org
  },
  { key: 'org' },
)
</script>

<script setup lang="ts">
import type { OrderAndQuickPay } from '@/stores/quick_pays.ts'
import { weekExportQuickPay } from '@/utils/export_quickPay_week.ts'
const quickPaysStore = useQuickPaysStore()
const usersStore = useUsersStore()
const vehiclesStore = useVehiclesStore()
const driversStore = useDriversStore()
const ownersStore = useOwnersStore()

defineOptions({
  __loaders: [useOrgData],
})

const selectedQpay = ref<OrderAndQuickPay | null>(null)

// const filters = ref([])

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
    label: 'order #',
    value: (v: OrderAndQuickPay) => v.number,
    size: 70,
  },
  {
    label: 'owner',
    value: (v: OrderAndQuickPay) =>
      resolve(
        v,
        'owner_' + v.qp_owner,
        () => ({ name: '-' }),
        () => ownersStore.resolve(v.qp_owner),
        (map) => map.name,
      ),
    size: 150,
  },
  {
    label: 'vehicle',
    value: (v: OrderAndQuickPay) =>
      resolve(
        v,
        'vehicle_' + v.qp_vehicle,
        () => ({ name: '-' }),
        () => vehiclesStore.resolve(v.qp_vehicle),
        (map) => map.name,
      ),
    size: 80,
  },
  {
    label: 'driver',
    value: (v: OrderAndQuickPay) =>
      resolve(
        v,
        'driver_' + v.qp_driver,
        () => ({ name: '-' }),
        () => driversStore.resolve(v.qp_driver),
        (map) => map.name,
      ),
    size: 140,
  },
  {
    label: 'amount',
    value: (v: OrderAndQuickPay) => '$' + v.qp_amount,
    size: 70,
  },
  {
    label: '%',
    value: (v: OrderAndQuickPay) => v.qp_percent,
    size: 40,
  },
  {
    label: 'to pay',
    value: (v: OrderAndQuickPay) => '$' + v.qp_to_pay,
    size: 70,
  },
  {
    label: 'note',
    value: (v: OrderAndQuickPay) => v.qp_note,
    color: (v: Status) => v.color,
    size: 200,
  },
  {
    label: 'created at',
    value: (v: OrderAndQuickPay) => useDateFormat(v.qp_created_at, 'MMM DD'),
    size: 80,
  },
  {
    label: 'request created',
    value: (v: OrderAndQuickPay) =>
      resolve(
        v,
        'created by_' + v.qp_created_by,
        () => ({ name: '?' }),
        () => usersStore.resolve(v.qp_created_by),
        (map) => map.name,
      ),
    size: 100,
  },
]

function openQpay(qpay: OrderAndQuickPay) {
  selectedQpay.value = qpay
}
</script>

<template>
  <QPayModal :document="selectedQpay"></QPayModal>
  <div class="grid grid-cols-2 px-3 mb-6 mt-4">
    <Text size="2xl">Approved quick pays</Text>
    <div class="place-self-end">
      <Button
        class="btn-soft font-light tracking-wider"
        @click="weekExportQuickPay(quickPaysStore.listing)"
        >Excel
      </Button>
    </div>
  </div>
  <table class="w-full text-left table-auto min-w-max">
    <thead>
      <tr
        class="text-sm text-gray-700 uppercase dark:text-gray-400 border-b dark:border-gray-700 border-gray-200"
      >
        <th
          v-for="col in cols"
          :key="'head_' + col.label"
          class="p-2"
          :style="{ width: col.size + 'px' }"
        >
          <p class="block antialiasing tracking-wider font-thin leading-none">
            {{ col.label }}
          </p>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="qpay in quickPaysStore.listing" :key="qpay.id" class="hover:bg-base-200">
        <td
          v-for="col in cols"
          :key="'row_' + col.label + '_' + qpay.id"
          class="py-3 px-2"
          :style="{ width: col.size + 'px' }"
          @click="openQpay(qpay)"
        >
          <p
            class="block antialiasing tracking-wide font-light leading-normal truncate"
            :style="{ width: col.size + 'px' }"
          >
            {{ col.value(qpay) }}
          </p>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped></style>
