<route lang="yaml">
meta:
layout: app
</route>

<script setup lang="ts">
import { ref } from 'vue'
import type { Organization } from '@/stores/organizations.ts'

const organizationStore = useOrganizationsStore()

const selectedOrganization = ref(null)

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
      <tr>
        <th
          v-for="col in cols"
          class="p-4 border-b border-b-gray-300"
          :style="{ width: col.size + 'px' }"
        >
          <p class="block text-sm antialiasing font-bold leading-none">
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
        <td
          v-for="col in cols"
          class="py-3 px-4 border-b border-b-gray-300"
          :style="{ width: col.size + 'px' }"
        >
          <p
            class="block text-sm antialiasing font-normal leading-normal truncate"
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
