<route lang="yaml">
meta:
layout: app
</route>

<script setup lang="ts">
const cols = [
  {
    label: 'Name',
    value: (v: Owner) => v.name,
    size: 300,
  },
  {
    label: 'Phone',
    value: (v: Owner) => v.phone,
    size: 120,
  },
  {
    label: 'Email',
    value: (v: Owner) => v.email,
    size: 300,
  },
]

const selectedOwner = ref(null)
const ownersStore = useOwnersStore()

function editOwner(owner: Owner) {
  console.log('editOwner', owner)
  selectedOwner.value = owner
}

function onClose() {
  console.log('closed')
  selectedOwner.value = null
}
</script>

<template>
  <OwnerModal :edit="selectedOwner" @closed="onClose"></OwnerModal>
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
      <tr v-for="owner in ownersStore.listing" :key="owner.id" @click="editOwner(owner)">
        <td
          v-for="col in cols"
          class="py-3 px-4 border-b border-b-gray-300"
          :style="{ width: col.size + 'px' }"
        >
          <p
            class="block text-sm antialiasing font-normal leading-normal truncate"
            :style="{ width: col.size + 'px' }"
          >
            {{ col.value(owner) }}
          </p>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped></style>
