<route lang="yaml">
meta:
layout: app
</route>

<script setup lang="ts">
import type { StatusNext } from '@/stores/statuses_next.ts'

const statusesStore = useStatusesStore()
const statusesNextStore = useStatusesNextStore()

function generateStyle(col, status: Status | null) {
  const style = {} // width: col.size + 'px'
  if (status?.color) {
    style['background-color'] = status.color // col.color(order)
  }
  return style
}

const cols = [
  {
    label: 'Name',
    value: (v: Status) => v.name,
    color: (v: Status) => v.color,
    size: 50,
  },
  {
    label: 'Next',
    value: (v: StatusNext) => v.next,
    // color: (v: Status) => v.color,
    size: 50,
  },
]

const selectedStatus = ref(null)
const selectedNextStatus = ref(null)

function editStatus(status: Status) {
  console.log('editStatus', status)
  selectedStatus.value = status
}

function selectNextStatus(status: Status) {
  console.log('nextStatus', status)
  selectedNextStatus.value = status
}

function onClose() {
  console.log('closed')
  selectedStatus.value = null
}
</script>

<template>
  <StatusModal :edit="selectedStatus" @closed="onClose" />
  <NextStatusModal :edit="selectedNextStatus"></NextStatusModal>

  <table class="w-full text-left table-auto min-w-max">
    <thead>
      <tr>
        <th
          v-for="col in cols"
          class="p-4 border-b border-b-gray-300"
          :style="{ width: col.size + 'px' }"
          :key="col.label"
        >
          <p class="block text-sm antialiasing font-bold leading-none">
            {{ col.label }}
          </p>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="status in statusesStore.listing" :key="status.id" @click="editStatus(status)">
        <td
          v-for="col in cols"
          :key="col.label"
          class="py-3 px-4"
          :style="generateStyle(col, status)"
        >
          <p
            v-if="col.label != 'Next'"
            class="block text-sm antialiasing font-normal leading-normal truncate"
            :style="{ width: col.size + 'px' }"
          >
            {{ col.value(status) }}
          </p>
          <p v-else>
            <!--                         v-for="nextstatus in statusesNextStore.listing" :key="nextstatus.id"-->
            <!--                        {{ col.value(nextstatus) }}-->
            <Button @click.stop="selectNextStatus(status)">+</Button>
          </p>
        </td>
      </tr>
    </tbody>
  </table>
</template>
