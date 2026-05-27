<route lang="yaml">
# @formatter:off
meta:
  layout: nav-view
</route>

<script lang="ts">
import { defineBasicLoader } from 'unplugin-vue-router/data-loaders/basic'
import { useEmployeeHiringStore } from '@/stores/employee_hiring_history.ts'

const organizationsStore = useOrganizationsStore()
const authStore = useAuthStore()
const employeeHiringStore = useEmployeeHiringStore()

export const useOrgData = defineBasicLoader(
  'oid',
  async (route) => {
    const org = await organizationsStore.resolve3(route.params.oid)
    authStore.org = org
    await employeeHiringStore.loading(org.id)
    // console.table(org)
    return org
  },
  { key: 'org' },
)
</script>

<script setup lang="ts">
import type { EmployeeHiring } from '@/stores/employee_hiring_history.ts'
const usersStore = useUsersStore()
const employeeHiringStore = useEmployeeHiringStore()

const selectedDocument = ref<EmployeeHiring | null>(null)

defineOptions({
  __loaders: [useOrgData],
})

function openRecord(record: EmployeeHiring) {
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
    label: 'employee',
    value: (v: EmployeeHiring) =>
      resolve(
        v,
        'employee_' + v.user_id,
        () => ({ name: '-' }),
        () => usersStore.resolve(v.user_id),
        (map) => map.real_name,
      ),
    size: 150,
  },
  {
    label: 'action',
    value: (v: EmployeeHiring) => v.action,
    size: 80,
  },
  {
    label: 'date',
    value: (v: EmployeeHiring) => v.date_action,
    size: 100,
  },
  {
    label: 'details',
    value: (v: EmployeeHiring) => v.details,
    size: 150,
  },
  {
    label: 'performed_by',
    value: (v: EmployeeHiring) =>
      resolve(
        v,
        'created_by_' + v.performed_by,
        () => ({ name: '-' }),
        () => usersStore.resolve(v.performed_by),
        (map) => map.real_name,
      ),
    size: 150,
  },
]
</script>

<template>
  <EmployeeHiringModal :edit="selectedDocument" @closed="onClose"></EmployeeHiringModal>
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
        v-for="record in employeeHiringStore.listing"
        :key="record.id"
        class="hover:bg-base-200"
        @click="openRecord(record)"
      >
        <td
          v-for="col in cols"
          :key="'row_' + col.label + '_' + record"
          class="py-3 px-4"
          :style="{ width: col.size + 'px' }"
        >
          <p
            class="block antialiasing tracking-wide font-light leading-normal truncate"
            :style="{ width: col.size + 'px' }"
          >
            {{ col.value(record) }}
          </p>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped></style>
