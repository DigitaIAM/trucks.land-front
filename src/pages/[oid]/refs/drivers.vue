<route lang="yaml">
# @formatter:off
meta:
  layout: nav-view
</route>

<script setup lang="ts">
const cols = [
  {
    label: 'Name',
    value: (v: Driver) => v.name,
    size: 300,
  },
  {
    label: 'Phone',
    value: (v: Driver) => v.phone,
    size: 300,
  },
  {
    label: 'Email',
    value: (v: Driver) => v.email,
    size: 300,
  },
  {
    label: 'Percentage',
    value: (v: Driver) => v.percentage,
    size: 120,
  },
]

const selectedDriver = ref(null)
const driversStore = useDriversStore()

function editDriver(driver: Driver) {
  selectedDriver.value = driver
}

function onClose() {
  selectedDriver.value = null
}

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
  <DriverModal :edit="selectedDriver" @closed="onClose"></DriverModal>
  <table class="w-full text-left table-auto min-w-max">
    <thead>
      <tr
        class="text-sm text-gray-700 uppercase dark:text-gray-400 border-b dark:border-gray-700 border-gray-200"
      >
        <th v-for="col in cols" class="p-4" :style="{ width: col.size + 'px' }">
          <p class="block antialiasing tracking-wider font-thin leading-none">
            {{ col.label }}
          </p>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="driver in driversStore.listing" :key="driver.id" @click="editDriver(driver)">
        <td v-for="col in cols" class="py-3 px-4" :style="{ width: col.size + 'px' }">
          <p
            class="block antialiasing tracking-wide font-light leading-normal truncate"
            :style="{ width: col.size + 'px' }"
          >
            {{ col.value(driver) }}
          </p>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped></style>
