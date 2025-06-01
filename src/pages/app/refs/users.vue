<route lang="yaml">
meta:
layout: app
</route>

<script setup lang="ts">
const usersStore = useUsersStore()

const selectedUser = ref(null)

function editUser(user: User) {
  selectedUser.value = user
}

function onClose() {
  selectedUser.value = null
}

const cols = [
  {
    label: 'Real name',
    value: (v) => v.real_name,
    size: 300,
  },
  {
    label: 'Name',
    value: (v) => v.name,
    size: 300,
  },
  {
    label: 'Group',
    value: (v) => v.group,
    size: 300,
  },
  {
    label: 'Phone',
    value: (v) => v.phone,
    size: 300,
  },
  {
    label: 'Email',
    value: (v) => v.email,
    size: 300,
  },
]
</script>

<template>
  <UserModal :edit="selectedUser" @closed="onClose"></UserModal>
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
      <tr v-for="user in usersStore.listing" :key="user.id" @click="editUser(user)">
        <td
          v-for="col in cols"
          class="py-3 px-4 border-b border-b-gray-300"
          :style="{ width: col.size + 'px' }"
        >
          <p
            class="block text-sm antialiasing font-normal leading-normal truncate"
            :style="{ width: col.size + 'px' }"
          >
            {{ col.value(user) }}
          </p>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped></style>
