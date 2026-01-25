<route lang="yaml">
# @formatter:off
meta:
  layout: nav-view
</route>

<script setup lang="ts">
const selectedRecord = ref<Insurance | null>(null)

function editRecord(record: Insurance) {
  selectedRecord.value = record
}

function onClose() {
  selectedRecord.value = null
}

const cols = [
  {
    label: 'Owner',
    value: (v: Owner) => v.name,
    size: 300,
  },
  {
    label: 'UnitId',
    value: (v: Owner) => v.phone,
    size: 300,
  },
  {
    label: 'Drivers',
    value: (v: Owner) => v.email,
    size: 300,
  },
  {
    label: 'Expiry date',
    value: (v: Owner) => v.email,
    size: 300,
  },
]
</script>

<template>
  <InsuranceCreate :edit="editRecord" @closed="onClose"></InsuranceCreate>
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
      <!--      <tr-->
      <!--        v-for="owner in ownersStore.listing"-->
      <!--        :key="owner.id"-->
      <!--        class="hover:bg-base-200"-->
      <!--        @click="editOwner(owner)"-->
      <!--      >-->
      <!--        <td-->
      <!--          v-for="col in cols"-->
      <!--          class="py-3 px-4"-->
      <!--          :key="col.label"-->
      <!--          :style="{ width: col.size + 'px' }"-->
      <!--        >-->
      <!--          <p-->
      <!--            class="block antialiasing tracking-wide font-light leading-normal truncate"-->
      <!--            :style="{ width: col.size + 'px' }"-->
      <!--          >-->
      <!--            {{ col.value(owner) }}-->
      <!--          </p>-->
      <!--        </td>-->
      <!--      </tr>-->
    </tbody>
  </table>
</template>

<style scoped></style>
