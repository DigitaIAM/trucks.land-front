<script setup lang="ts">
const props = defineProps<{
  store: Searchable
}>()

const searchQuery = ref('')

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
          props.store.searchAndListing(query.toString().trim().toLowerCase())
        }
      }, delay)
    } else {
      props.store.searchAndListing(null)
    }
  },
)
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
  </div>
</template>

<style scoped></style>
