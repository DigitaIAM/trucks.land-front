<route lang="yaml">
# @formatter:off
meta:
  layout: nav-view
</route>

<script lang="ts">
import { defineBasicLoader } from 'unplugin-vue-router/data-loaders/basic'

const organizationsStore = useOrganizationsStore()
const authStore = useAuthStore()
const reportOwner = useReportOwner()

export const useOrgData = defineBasicLoader(
  'oid',
  async (route) => {
    const org = await organizationsStore.resolve3(route.params.oid)
    authStore.org = org
    await reportOwner.loading(org.id)
    // console.table(org)
    return org
  },
  { key: 'org' },
)
</script>

<script setup lang="ts">
import moment from 'moment'

const reportOwnerStore = useReportOwner()
const ownersStore = useOwnersStore()
const authStore = useAuthStore()

const state = reactive({})

const selectedOwner = ref<number | null>(null)

const ts = moment().subtract(3, 'days')
const currentYear = ref(ts.year())
const currentWeek = ref(ts.isoWeek())

defineOptions({
  __loaders: [useOrgData],
})

function openPayment(record: OwnerPaymentSummary) {
  selectedOwner.value = record.owner
}

function onClose() {
  selectedOwner.value = null
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
    label: 'owner',
    value: (v: OwnerPaymentSummary) =>
      resolve(
        v,
        'owner_' + v.owner,
        () => ({ name: '-' }),
        () => ownersStore.resolve(v.owner),
        (map) => map.name,
      ),
    size: 200,
  },
  {
    label: 'orders',
    value: (v: OwnerPaymentSummary) => v.orders_number,
    size: 100,
  },
  {
    label: 'receive',
    value: (v: OwnerPaymentSummary) => '$' + v.orders_driver,
    size: 100,
  },
  {
    label: 'expenses',
    value: (v: OwnerPaymentSummary) => '$' + v.expenses_total,
    size: 100,
  },
  {
    label: 'payout',
    value: (v: OwnerPaymentSummary) => '$' + v.payout,
    size: 100,
  },
]

async function createPayment() {
  await reportOwnerStore.createPayment(
    authStore.org?.id,
    currentYear.value,
    currentWeek.value,
  )
}

</script>

<template>
  <OwnerPayment :org-id="authStore.oid" :owner-id="selectedOwner" @closed="onClose"></OwnerPayment>
  <div class="flex flex-row items-center gap-6 px-4 mb-2 mt-3">
    <Text size="2xl">Report</Text>
    <SearchVue :store="ownersStore"></SearchVue>
    <div>#{{ currentWeek }}</div>
    <div>{{ currentYear }}</div>
    <Button
      :disabled="reportOwnerStore.owners.length == 0"
      class="btn-soft font-light tracking-wider"
      @click="createPayment()"
      >Close week</Button
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
        v-for="line in reportOwnerStore.owners"
        :key="line.owner"
        @click="openPayment(line)"
        :class="{
          processing: reportOwnerStore.processing[0] == line.owner,
          done: reportOwnerStore.processing[1] == line.owner,
        }"
      >
        <td
          v-for="col in cols"
          :key="'row_' + col.label + '_' + line.owner"
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

<style scoped>
.processing {
  background-color: orange;
}

.done {
  background-color: green;
}
</style>
