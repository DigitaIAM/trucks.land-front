<route lang="yaml">
meta:
layout: app
</route>

<script setup lang="ts">
import { useUsersStore } from '@/stores/users.ts'

const ordersStore = useOrdersStore()
const usersStore = useUsersStore()

ordersStore.setContext([])

const state = reactive({})

const selectedDispatcher = ref(null)

function openPayment(payment: Payment) {
  selectedDispatcher.value = payment
}

function onClose() {
  selectedDispatcher.value = null
}

function resolve(
  order: Order,
  name: string,
  create: () => object,
  request: () => Promise<object | null>,
  label: (obj: object) => string,
) {
  const s = state[order.id] ?? {}
  if (s && s[name]) {
    return label(s[name])
  } else {
    s[name] = create()
    state[order.id] = s
    request().then((obj) => {
      if (obj) state[order.id][name] = obj
    })
    return label(s[name])
  }
}

const cols = [
  {
    label: 'Dispatcher',
    value: (v: Order) =>
      resolve(
        v,
        'dispatcher',
        () => ({ name: '?' }),
        () => usersStore.resolve(v.dispatcher),
        (map) => map.real_name,
      ),
    size: 200,
  },
  {
    label: 'Amount',
    value: (v) => v.amount,
    size: 100,
  },
  {
    label: 'Payed',
    value: (v) => v.payed,
    size: 100,
  },
  {
    label: 'Created at',
    value: (v) => v.created_at,
    size: 200,
  },
  {
    label: 'Note',
    value: (v) => v.note,
    size: 200,
  },
  {
    label: 'Created by',
    value: (v) => v.created_by,
    size: 150,
  },
]
</script>

<template>
  <DispatcherPayment :edit="selectedDispatcher" @closed="onClose"></DispatcherPayment>
  <div class="flex flex-row gap-6 px-4 mb-2 mt-3">
    <Text size="2xl">Payments to dispatchers</Text>
    <Search store=""></Search>
    <Button class="btn-accent">Create</Button>
  </div>
  <table class="w-full mt-6 text-left table-auto min-w-max">
    <thead>
      <tr>
        <th
          v-for="col in cols"
          :key="'head_' + col.label"
          class="p-4 border-b border-b-gray-400"
          :style="{ width: col.size + 'px' }"
        >
          <p class="block antialiasing font-bold leading-none">
            {{ col.label }}
          </p>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="document in ordersStore.listing" :key="document.id" @click="openPayment(payment)">
        <td
          v-for="col in cols"
          :key="'row_' + col.label + '_' + document.id"
          class="py-3 px-4 border-b border-b-gray-400"
          :style="{ width: col.size + 'px' }"
        >
          <p
            class="block antialiasing font-normal leading-normal truncate"
            :style="{ width: col.size + 'px' }"
          >
            {{ col.value(document) }}
          </p>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped></style>
