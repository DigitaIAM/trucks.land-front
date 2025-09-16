<route lang="yaml">
# @formatter:off
meta:
  layout: nav-view
</route>

<script lang="ts">
import { defineBasicLoader } from 'unplugin-vue-router/data-loaders/basic'

const organizationsStore = useOrganizationsStore()
const authStore = useAuthStore()
const paymentsAdditionalToEmployeeStore = usePaymentsAdditionalToEmployeeStore()

export const useOrgData = defineBasicLoader(
  'oid',
  async (route) => {
    const org = await organizationsStore.resolve3(route.params.oid)
    authStore.org = org
    await paymentsAdditionalToEmployeeStore.loading(org.id)
    // console.table(org)
    return org
  },
  { key: 'org' },
)
</script>

<script setup lang="ts">
const usersStore = useUsersStore()
const paymentsAdditionalToEmployeeStore = usePaymentsAdditionalToEmployeeStore()

const selectedDocument = ref<PaymentsAdditionalToEmployee | null>(null)

defineOptions({
  __loaders: [useOrgData],
})

function openPayment(payment: PaymentsAdditionalToEmployee) {
  selectedDocument.value = payment
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
    value: (v: PaymentsAdditionalToEmployee) => v.id,
    size: 30,
  },
  {
    label: 'created at',
    value: (v: PaymentsAdditionalToEmployee) => useDateFormat(v.created_at, 'MMM DD'),
    size: 80,
  },
  {
    label: 'employee',
    value: (v: PaymentsAdditionalToEmployee) =>
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
    value: (v: PaymentsAdditionalToEmployee) => v.kind,
    size: 150,
  },
  {
    label: 'amount',
    value: (v: PaymentsAdditionalToEmployee) => '$' + v.amount,
    size: 100,
  },
  {
    label: 'created by',
    value: (v: PaymentsAdditionalToEmployee) =>
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
  <PaymentAdditionalEmployee :edit="selectedDocument" @closed="onClose"></PaymentAdditionalEmployee>
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
        v-for="payment in paymentsAdditionalToEmployeeStore.listing"
        :key="payment.id"
        @click="openPayment(payment)"
      >
        <td
          v-for="col in cols"
          :key="'row_' + col.label + '_' + payment"
          class="py-3 px-4"
          :style="{ width: col.size + 'px' }"
        >
          <p
            class="block antialiasing tracking-wide font-light leading-normal truncate"
            :style="{ width: col.size + 'px' }"
          >
            {{ col.value(payment) }}
          </p>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped></style>
