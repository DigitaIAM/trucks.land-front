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
const quickPaysStore = useQuickPaysStore()

export const useOrgData = defineBasicLoader(
  'oid',
  async (route) => {
    const org = await organizationsStore.resolve3(route.params.oid)
    authStore.org = org
    await quickPaysStore.loading(org.id)
    return org
  },
  { key: 'org' },
)
</script>

<script setup lang="ts">
// import { weekExportQuickPay } from '@/utils/export_quickPay_week.ts'
import type { OrderAndQuickPay } from '@/stores/quick_pays.ts'
const quickPaysStore = useQuickPaysStore()
const usersStore = useUsersStore()
const vehiclesStore = useVehiclesStore()
const driversStore = useDriversStore()
const ownersStore = useOwnersStore()

defineOptions({
  __loaders: [useOrgData],
})

const orgData = useOrgData()

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
    label: '#',
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
    size: 150,
  },
  {
    label: 'amount',
    value: (v: OrderAndQuickPay) => '$' + v.qp_amount,
    size: 80,
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

// function setFilter(key, val) {
//   const index = filters.value.findIndex((v) => v.key === key)
//   if (index < 0) {
//     filters.value.push({ key: key, val: val })
//   } else {
//     filters.value[index] = { key: key, val: val }
//   }
//
//   orders.setFilters(filters.value)
// }
//
// function delFilter(key) {
//   const index = filters.value.findIndex((v) => v.key === key)
//   if (index >= 0) {
//     filters.value.splice(index, 1)
//   }
//
//   orders.setFilters(filters.value)
// }

// function capitalizeFirstLetter(val) {
//   return String(val).charAt(0).toUpperCase() + String(val).slice(1)
// }
</script>

<template>
  <QPayModal :document="selectedQpay"></QPayModal>
  <div class="flex flex-row gap-6 px-4 mb-2 mt-3">
    <Text size="2xl">Requested quick pays</Text>
    <!--    <SearchAll @selected="setFilter" :org="orgData.data.value"></SearchAll>-->
    <!--    <Button-->
    <!--      class="btn-soft font-light tracking-wider ml-6"-->
    <!--      @click="weekExportQuickPay(quickPaysStore.listing)"-->
    <!--      >Excel-->
    <!--    </Button>-->
  </div>
  <!--  <div class="flex flex-row gap-6 px-4 mb-2 mt-3">-->
  <!--    <Badge lg ghost v-for="filter in filters" :key="filter.key" @click="delFilter(filter.key)">-->
  <!--      <div class="font-thin tracking-wider text-sm text-gray-700 uppercase dark:text-gray-400">-->
  <!--        {{ capitalizeFirstLetter(filter.key) }}:-->
  <!--      </div>-->
  <!--      <div>{{ filter.val.name }}</div>-->
  <!--      <svg-->
  <!--        xmlns="http://www.w3.org/2000/svg"-->
  <!--        fill="none"-->
  <!--        viewBox="0 0 24 24"-->
  <!--        stroke-width="1.5"-->
  <!--        stroke="currentColor"-->
  <!--        class="size-4"-->
  <!--      >-->
  <!--        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />-->
  <!--      </svg>-->
  <!--    </Badge>-->
  <!--  </div>-->
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
