<route lang="yaml">
# @formatter:off
meta:
  layout: nav-view
</route>

<script lang="ts">
import { defineBasicLoader } from 'unplugin-vue-router/data-loaders/basic'
import { useAgreementCostLogsStore } from '@/stores/agreement_cost_logs'

const organizationsStore = useOrganizationsStore()
const authStore = useAuthStore()
const agreementCostLogsStore = useAgreementCostLogsStore()

export const useOrgData = defineBasicLoader(
  'oid',
  async (route) => {
    const org = await organizationsStore.resolve3(route.params.oid as string)
    authStore.org = org
    if (org) {
      await agreementCostLogsStore.fetching(org.id)
    }
    return org
  },
  { key: 'org' },
)
</script>

<script setup lang="ts">
const usersStore = useUsersStore()
const ordersStore = useOrdersStore()

defineOptions({
  __loaders: [useOrgData],
})

const orgData = useOrgData()

const orderNumbers = reactive<Record<number, number>>({})
const userNames = reactive<Record<number, string>>({})

watch(
  () => agreementCostLogsStore.listing,
  async (listing) => {
    for (const log of listing) {
      if (orderNumbers[log.document] === undefined) {
        const order = await ordersStore.resolve(log.document)
        orderNumbers[log.document] = order?.number ?? log.document
      }
      if (userNames[log.created_by] === undefined) {
        const user = await usersStore.resolve(log.created_by)
        userNames[log.created_by] = user?.name ?? '—'
      }
    }
  },
  { immediate: true, deep: true },
)

function formatDate(value: Date) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
    hour12: true,
  })
}

function formatCost(value: number | null) {
  return value == null ? '—' : '$ ' + value
}

function openOrder(id: number) {
  window.open('/' + orgData.data.value?.code3.toLowerCase() + '/order/' + id, '_blank')
}
</script>

<template>
  <div class="flex flex-row gap-6 px-4 mb-2 mt-3">
    <Text size="2xl">Changes</Text>
  </div>
  <table class="w-full text-left table-auto min-w-max">
    <thead>
      <tr
        class="text-sm text-gray-700 uppercase dark:text-gray-400 border-b dark:border-gray-700 border-gray-200"
      >
        <th class="p-4">
          <p class="block antialiasing tracking-wider font-thin leading-none">Date</p>
        </th>
        <th class="p-4">
          <p class="block antialiasing tracking-wider font-thin leading-none">Order</p>
        </th>
        <th class="p-4">
          <p class="block antialiasing tracking-wider font-thin leading-none">Old sum</p>
        </th>
        <th class="p-4">
          <p class="block antialiasing tracking-wider font-thin leading-none">New sum</p>
        </th>
        <th class="p-4">
          <p class="block antialiasing tracking-wider font-thin leading-none">Changed by</p>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="log in agreementCostLogsStore.listing" :key="log.id" class="hover:bg-base-200">
        <td class="py-3 px-4">
          <p class="block antialiasing tracking-wide font-light leading-normal truncate">
            {{ formatDate(log.created_at) }}
          </p>
        </td>
        <td class="py-3 px-4">
          <p
            class="block antialiasing tracking-wide font-light leading-normal truncate cursor-pointer"
            @click="openOrder(log.document)"
          >
            {{ orderNumbers[log.document] ?? log.document }}
          </p>
        </td>
        <td class="py-3 px-4">
          <p class="block antialiasing tracking-wide font-light leading-normal truncate">
            {{ formatCost(log.old_cost) }}
          </p>
        </td>
        <td class="py-3 px-4">
          <p class="block antialiasing tracking-wide font-light leading-normal truncate">
            {{ formatCost(log.new_cost) }}
          </p>
        </td>
        <td class="py-3 px-4">
          <p class="block antialiasing tracking-wide font-light leading-normal truncate">
            {{ userNames[log.created_by] ?? '—' }}
          </p>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped></style>
