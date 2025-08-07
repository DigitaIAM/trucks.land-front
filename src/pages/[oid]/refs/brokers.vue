<!--<route lang="yaml">-->
<!--meta:-->
<!--layout: app-->
<!--</route>-->

<script setup lang="ts">
import type { Broker } from '@/stores/brokers.ts'

const brokersStore = useBrokersStore()

const selectedBroker = ref(null)

function editBroker(broker: Broker) {
  selectedBroker.value = broker
}

function onClose() {
  selectedBroker.value = null
}

const cols = [
  {
    label: 'Name',
    value: (v) => v.name,
    size: 300,
  },
  {
    label: 'Phone',
    value: (v) => v.phone,
    size: 320,
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
  <BrokerModal :edit="selectedBroker" @closed="onClose"></BrokerModal>
  <table class="w-full text-left table-auto min-w-max">
    <thead>
      <tr>
        <th
          v-for="col in cols"
          class="p-4 border-b border-b-gray-400"
          :style="{ width: col.size + 'px' }"
        >
          <p class="block text-sm antialiasing font-bold leading-none">
            {{ col.label }}
          </p>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="broker in brokersStore.listing" :key="broker.id" @click="editBroker(broker)">
        <td
          v-for="col in cols"
          class="py-3 px-4 border-b border-b-gray-400"
          :style="{ width: col.size + 'px' }"
        >
          <p
            class="block text-sm antialiasing font-normal leading-normal truncate"
            :style="{ width: col.size + 'px' }"
          >
            {{ col.value(broker) }}
          </p>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped></style>
