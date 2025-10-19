<route lang="yaml">
# @formatter:off
meta:
  layout: nav-view
</route>

<script setup lang="ts">
import type { Broker } from '@/stores/brokers.ts'

const brokersStore = useBrokersStore()

const selectedBroker = ref<Broker | null>(null)

function editBroker(broker: Broker) {
  selectedBroker.value = broker
}

function onClose() {
  selectedBroker.value = null
}

const cols = [
  {
    label: 'Name',
    value: (v: Broker) => v.name,
    size: 300,
  },
  {
    label: 'Phone',
    value: (v: Broker) => v.phone,
    size: 320,
  },
  {
    label: 'Email',
    value: (v: Broker) => v.email,
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
      <tr v-for="broker in brokersStore.listing" :key="broker.id" @click="editBroker(broker)">
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
            {{ col.value(broker) }}
          </p>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped></style>
