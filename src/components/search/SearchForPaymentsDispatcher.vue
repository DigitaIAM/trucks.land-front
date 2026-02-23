<script setup lang="ts">
const emit = defineEmits(['selected'])

const usersStore = useUsersStore()

const isOpen = computed(() => searchQuery.value.toString().length != 0)
const isSetResult = computed(
  () => dispatchers.value?.length != 0 || years.value?.length != 0 || months.value?.length != 0,
)

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

const years = computedAsync(async () => {
  const list = [{ id: 2025, name: '2025' }, { id: 2026, name: '2026' }]
  const str = queryStr.value
  if (str) {
    return list.filter((v) => v.name.indexOf(str) >= 0)
  }
  return []
}, [])

const months = computedAsync(async () => {
  const list = Array.from({ length: 12 }, (_, index) => {
    const month = 1 + index
    return {
      id: month,
      name: month.toString(),
    }
  })
  const str = queryStr.value
  if (str) {
    return list.filter((v) => v.name.indexOf(str) >= 0)
  }
  return []
}, [])

const dispatchers = computedAsync(async () => {
  const str = queryStr.value
  if (str) {
    return await usersStore.search(str)
  }
  return []
}, [])

function select(field: string, value: any) {
  emit('selected', field, value)
  searchQuery.value = ''
}
</script>

<template>
  <div class="flex-1/2">
    <div
      class="flex items-center px-2 py-2 group hover:ring-1 hover:ring-gray-200 focus-within:!ring-2 ring-inset focus-within:!ring-blue-500 rounded-sm"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="mr-2 size-5"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
        />
      </svg>
      <input
        class="block appearance-none bg-transparent text-base focus:outline-none"
        placeholder=""
        aria-label="Search components"
        id="headlessui-combobox-input-:r5n:"
        role="combobox"
        type="text"
        aria-expanded="false"
        aria-autocomplete="list"
        v-model="searchQuery"
      />
    </div>
    <div
      v-if="isOpen && isSetResult"
      class="absolute z-50 bg-base-300 rounded-lg overflow-hidden overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full"
      style="display: block; margin-bottom: 5px"
    >
      <div class="flex flex-col-5 gap-10 mb-2 mx-2">
        <SearchBlock @click="select" id="dispatcher" label="dispatchers" :items="dispatchers" />
        <SearchBlock @click="select" id="month" label="month" :items="months"></SearchBlock>
        <SearchBlock @click="select" id="year" label="year" :items="years"></SearchBlock>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
