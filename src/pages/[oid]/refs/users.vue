<route lang="yaml">
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
const usersStore = useUsersStore()

const selectedUser = ref(null)

defineOptions({
  __loaders: [useOrgData],
})

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

const searchQuery = ref('')
const queryStr = ref('')

let timer: ReturnType<typeof setTimeout>
const delay = 250

watch(
  () => searchQuery.value,
  (query: string) => {
    clearTimeout(timer)
    if (query) {
      const text = query
      timer = setTimeout(() => {
        const query = searchQuery.value
        if (text === query) {
          queryStr.value = query.toString().trim().toLowerCase()
        }
      }, delay)
    } else {
      queryStr.value = ''
    }
  },
)
</script>

<template>
  <UserModal :edit="selectedUser" @closed="onClose"></UserModal>
  <table class="w-full text-left table-auto min-w-max">
    <thead>
    <tr
      class="text-sm text-gray-700 uppercase dark:text-gray-400 border-b dark:border-gray-700 border-gray-200"
    >
        <th
          v-for="col in cols"
          class="p-4 border-b border-b-gray-400"
          :style="{ width: col.size + 'px' }"
        >
          <p class="block antialiasing tracking-wider font-thin leading-none">
            {{ col.label }}
          </p>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="user in usersStore.listing" :key="user.id" @click="editUser(user)">
        <td
          v-for="col in cols"
          class="py-3 px-4"
          :style="{ width: col.size + 'px' }"
        >
          <p
            class="block antialiasing tracking-wide font-light leading-normal truncate"
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
