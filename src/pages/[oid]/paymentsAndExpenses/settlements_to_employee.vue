<route lang="yaml">
# @formatter:off
meta:
  layout: nav-view
</route>

<script lang="ts">
import { defineBasicLoader } from 'unplugin-vue-router/data-loaders/basic'

const organizationsStore = useOrganizationsStore()
const authStore = useAuthStore()
const settlementsEmployeeStore = useSettlementsEmployeeStore()

export const useOrgData = defineBasicLoader(
  'oid',
  async (route) => {
    const org = await organizationsStore.resolve3(route.params.oid)
    authStore.org = org
    await settlementsEmployeeStore.loading(org.id)
    // console.table(org)
    return org
  },
  { key: 'org' },
)
</script>

<script setup lang="ts">
const usersStore = useUsersStore()
const settlementsEmployeeStore = useSettlementsEmployeeStore()

const selectedDocument = ref<SettlementEmployee | null>(null)

defineOptions({
  __loaders: [useOrgData],
})

function openSettlement(settlement: SettlementEmployee) {
  selectedDocument.value = settlement
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
    value: (v: SettlementEmployee) => v.id,
    size: 30,
  },
  {
    label: 'created at',
    value: (v: SettlementEmployee) => useDateFormat(v.created_at, 'MMM DD'),
    size: 80,
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
    label: 'payment',
    value: (v: SettlementEmployee) => v.notes,
    size: 150,
  },
  {
    label: 'amount',
    value: (v: SettlementEmployee) => '$' + v.amount,
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
        (map) => map.name,
      ),
    size: 100,
  },
]
</script>

<template>
  <SettlementEmployeeModal :edit="selectedDocument" @closed="onClose"></SettlementEmployeeModal>
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
