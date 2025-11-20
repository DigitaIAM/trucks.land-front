<route lang="yaml">
# @formatter:off
meta:
  layout: nav-view
</route>

<script setup lang="ts">
import { ref } from 'vue'
import type { Organization } from '@/stores/organizations.ts'

const organizationStore = useOrganizationsStore()

const selectedOrganization = ref<Organization | null>(null)

function editOrganization(organization: Organization) {
  selectedOrganization.value = organization
}

function onClose() {
  selectedOrganization.value = null
}

const cols = [
  {
    label: 'Code',
    value: (v: Organization) => v.code3,
    size: 300,
  },
  {
    label: 'Name',
    value: (v: Organization) => v.name,
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
        <th v-for="col in cols" :key="col.label" class="p-4" :style="{ width: col.size + 'px' }">
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
        class="hover:bg-base-200"
        @click="editOrganization(organization)"
      >
        <td
          v-for="col in cols"
          :key="col.label"
          class="py-3 px-4"
          :style="{ width: col.size + 'px' }"
        >
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
