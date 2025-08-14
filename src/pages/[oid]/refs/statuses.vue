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
const statusesStore = useStatusesStore()
const statusesNextStore = useStatusesNextStore()

const state = reactive({})

function resolveStatus(id: number) {
  const s = state[id]
  if (s) {
    return s
  } else {
    const ns = { id: id, name: '?' }
    state[id] = ns
    statusesStore.resolve(id).then((obj) => {
      if (obj) state[id] = obj
    })
    return ns
  }
}

function generateStyle(status: Status | null) {
  const style = {} // width: col.size + 'px'
  if (status?.color) {
    style['background-color'] = status.color // col.color(order)
  }
  return style
}

const selectedStatus = ref(null)
const selectedNextStatus = ref(null)

defineOptions({
  __loaders: [useOrgData],
})

function editStatus(status: Status) {
  selectedStatus.value = status
}

function selectNextStatus(status: Status) {
  selectedNextStatus.value = status
}

function onClose() {
  selectedStatus.value = null
}
</script>

<template>
  <StatusModal :edit="selectedStatus" @closed="onClose" />
  <NextStatusModal :edit="selectedNextStatus"></NextStatusModal>

  <table class="w-full text-left table-auto min-w-max">
    <thead>
      <tr
        class="text-sm text-gray-700 uppercase dark:text-gray-400 border-b dark:border-gray-700 border-gray-200"
      >
        <th class="p-4" :style="{ width: 300 + 'px' }">
          <p class="block antialiasing tracking-wider font-thin leading-none">Name</p>
        </th>
        <th class="p-4" :style="{ width: 300 + 'px' }">
          <p class="block antialiasing tracking-wider font-thin leading-none">Next</p>
        </th>
        <th class="p-4" :style="{ width: 50 + 'px' }">
          <p class="block antialiasing tracking-wider font-thin leading-none">Add next</p>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="status in statusesStore.listing" :key="status.id" @click="editStatus(status)">
        <td class="py-3 px-4" :style="generateStyle(status)">
          <p
            class="block text-sm antialiasing font-normal leading-normal truncate"
            :style="{ width: 300 + 'px' }"
          >
            {{ status.name }}
          </p>
        </td>
        <td class="py-3 px-4" :style="generateStyle(status)">
          <p
            class="block text-sm antialiasing font-normal leading-normal truncate"
            :style="{ width: 300 + 'px' }"
          >
            <span v-for="id in statusesNextStore.nextFor(status.id)" :key="id" class="mr-4">
              {{ resolveStatus(id).name }}
            </span>
          </p>
        </td>
        <td class="py-3 px-4" :style="generateStyle(status)">
          <p
            class="block text-sm antialiasing font-normal leading-normal truncate"
            :style="{ width: 50 + 'px' }"
          >
            <span class="mr-4">
              <Button ghost sm @click.stop="selectNextStatus(status)">+</Button>
            </span>
          </p>
        </td>
      </tr>
    </tbody>
  </table>
</template>
