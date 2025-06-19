<script setup lang="ts">
const cols = [
  {
    label: 'Dispatcher',
    value: (v) => v.dispatcher,
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

const documents = [
  {
    dispatcher: 'Тареев Вячеслав',
    amount: '26',
    payed: 'false',
    created_at: '2025-05-21T06:08:18.661Z',
    note: '',
    created_by: 'Rano Mullaeva',
  },
  {
    dispatcher: 'Timur Adashov',
    amount: '14',
    payed: 'false',
    created_at: '2025-05-21T06:08:18.432Z',
    note: '',
    created_by: 'Rano Mullaeva',
  },
  {
    dispatcher: 'Faridun Tolibjonov',
    amount: '148',
    payed: 'false',
    created_at: '2025-05-21T06:08:18.132Z',
    note: '',
    created_by: 'Rano Mullaeva',
  },
]
</script>

<template>
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
      <tr v-for="document in documents">
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
