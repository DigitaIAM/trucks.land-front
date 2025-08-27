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
const expensesStore = useExpensesToOwnerStore()
const ownersStore = useOwnersStore()
const usersStore = useUsersStore()

const state = reactive({})

const selectedDocument = ref(null)

defineOptions({
  __loaders: [useOrgData],
})

function openExpenses(record: ExpensesToOwner) {
  selectedDocument.value = record.owner
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
    value: (v: ExpensesToOwner) => v.id,
    size: 30,
  },
  {
    label: 'created at',
    value: (v: ExpensesToOwner) => useDateFormat(v.create_at, 'MMM DD'),
    size: 80,
  },
  {
    label: 'owner',
    value: (v: ExpensesToOwner) =>
      resolve(
        v,
        'owner_' + v.owner,
        () => ({ name: '-' }),
        () => ownersStore.resolve(v.owner),
        (map) => map.name,
      ),
    size: 150,
  },
  {
    label: 'expenses',
    value: (v: ExpensesToOwner) => v.kind,
    size: 100,
  },
  {
    label: 'amount',
    value: (v: ExpensesToOwner) => '$' + v.amount,
    size: 100,
  },
  {
    label: 'created by',
    value: (v: ExpensesToOwner) =>
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
  <ExpensesOwner :edit="selectedDocument" @closed="onClose"></ExpensesOwner>
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
      <tr v-for="line in expensesStore.listing" :key="line.id" @click="openExpenses(line)">
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
