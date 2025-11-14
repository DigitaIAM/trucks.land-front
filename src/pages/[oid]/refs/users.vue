<route lang="yaml">
# @formatter:off
meta:
  layout: nav-view
</route>

<script setup lang="ts">
const usersStore = useUsersStore()

const selectedUser = ref<User | null>(null)

function editUser(user: User) {
  selectedUser.value = user
}

function onClose() {
  selectedUser.value = null
}

const cols = [
  {
    label: 'Real name',
    value: (v: User) => v.real_name,
    size: 300,
  },
  {
    label: 'Name',
    value: (v: User) => v.name,
    size: 300,
  },
  {
    label: 'Phone',
    value: (v: User) => v.phone,
    size: 300,
  },
  {
    label: 'Email',
    value: (v: User) => v.email,
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
          class="p-4"
          :key="col.label"
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
          :key="col.label"
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
