<route lang="yaml">
# @formatter:off
meta:
  layout: nav-view
</route>

<script lang="ts">
import { defineBasicLoader } from 'unplugin-vue-router/data-loaders/basic'

const organizationsStore = useOrganizationsStore()
const authStore = useAuthStore()
const insurancesStore = useInsuranceStore()

export const useOrgData = defineBasicLoader(
  'oid',
  async (route) => {
    const org = await organizationsStore.resolve3(route.params.oid)
    authStore.org = org
    await insurancesStore.loading(org.id)
    // console.table(org)
    return org
  },
  { key: 'org' },
)
</script>

<script setup lang="ts">
defineOptions({
  __loaders: [useOrgData],
})

const orgData = useOrgData()

const selectedRecord = ref<Insurance | null>(null)

const insurancesStore = useInsuranceStore()

function openRecord(id: number) {
  window.open('/' + orgData.data.value.code3.toLowerCase() + '/insurance/' + id, '_blank')
  console.log('openRecord', id)
}

function onClose() {
  selectedRecord.value = null
}

const cols = [
  {
    label: 'Policy number',
    value: (v: Insurance) => v.policy_number,
    size: 300,
  },
  {
    label: 'POLICY EFF',
    value: (v: Insurance) => v.start_date,
    size: 300,
  },
  {
    label: 'POLICY EXP',
    value: (v: Insurance) => v.end_date,
    size: 300,
  },
  // {
  //   label: 'Owner',
  //   value: (v: Owner) => v.name,
  //   size: 300,
  // },
  // {
  //   label: 'UnitId',
  //   value: (v: Owner) => v.phone,
  //   size: 300,
  // },
  // {
  //   label: 'Drivers',
  //   value: (v: Owner) => v.email,
  //   size: 300,
  // },
  // {
  //   label: 'Expiry date',
  //   value: (v: Owner) => v.email,
  //   size: 300,
  // },
]
</script>

<template>
  <InsuranceCreate :edit="openRecord" @closed="onClose"></InsuranceCreate>
  <table class="w-full text-left table-auto min-w-max">
    <thead>
      <tr
        class="text-sm text-gray-700 uppercase dark:text-gray-400 border-b dark:border-gray-700 border-gray-200"
      >
        <th v-for="col in cols" :key="col.label" class="p-4" :style="{ width: col.size + 'px' }">
          <p class="block antialiasing tracking-wider font-thin leading-none">
            {{ col.label }}
          </p>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="insurance in insurancesStore.listing"
        :key="insurance.id"
        class="hover:bg-base-200"
        @click="openRecord(insurance.id)"
      >
        <td
          v-for="col in cols"
          class="py-3 px-4"
          :key="col.label"
          :style="{ width: col.size + 'px' }"
        >
          <p
            class="block antialiasing tracking-wide font-light leading-normal truncate"
            :style="{ width: col.size + 'px' }"
          >
            {{ col.value(insurance) }}
          </p>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped></style>
