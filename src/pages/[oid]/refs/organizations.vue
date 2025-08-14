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
    ordersStore.setContext([{ key: 'organization', val: org.id } as KV])
    // console.table(org)
    return org
  },
  { key: 'org' },
)
</script>

<script setup lang="ts">
import { ref } from 'vue'
import type { Organization } from '@/stores/organizations.ts'

const organizationStore = useOrganizationsStore()

const selectedOrganization = ref(null)

defineOptions({
  __loaders: [useOrgData],
})

function editOrganization(organization: Organization) {
  selectedOrganization.value = organization
}

function onClose() {
  selectedOrganization.value = null
}

const cols = [
  {
    label: 'Code',
    value: (v) => v.code3,
    size: 300,
  },
  {
    label: 'Name',
    value: (v) => v.name,
    size: 300,
  },
]
</script>

<template>
  <OrganinizationModal :edit="selectedOrganization" @closed="onClose"></OrganinizationModal>
  <table class="w-full text-left table-auto min-w-max">
    <thead>
      <tr
        class="text-sm text-gray-700 uppercase dark:text-gray-400 border-b dark:border-gray-700 border-gray-200"
      >
        <th v-for="col in cols" class="p-4" :style="{ width: col.size + 'px' }">
          <p class="block antialiasing tracking-wider font-thin leading-none">
            {{ col.label }}
          </p>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="organization in organizationStore.listing"
        :key="organization.id"
        @click="editOrganization(organization)"
      >
        <td v-for="col in cols" class="py-3 px-4" :style="{ width: col.size + 'px' }">
          <p
            class="block antialiasing tracking-wide font-light leading-normal truncate"
            :style="{ width: col.size + 'px' }"
          >
            {{ col.value(organization) }}
          </p>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped></style>
