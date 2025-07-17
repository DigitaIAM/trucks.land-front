<script setup lang="ts">
const props = defineProps<{
  modelValue?: Reference | Suggestion | null
  store: Searchable
}>()

const emit = defineEmits(['update:modelValue', 'build'])

const isOpen = ref(false)
const isSetResult = ref(false)
const isNotFound = ref(false)

const valueAsText = ref(props.modelValue?.name || '')

watch(() => props.modelValue, init)
watch(
  () => valueAsText.value,
  (value: string) => {
    if (isSetResult.value) {
      isSetResult.value = false
      suggestions.value = []
    } else {
      querying(value)
      isOpen.value = value !== ''
    }
  },
)

async function init(suggestion: Reference | Suggestion) {
  // console.log('modelValue', suggestion)
  if (suggestion) {
    const obj = await props.store.resolve(suggestion.id)
    if (obj) {
      isNotFound.value = obj ? false : true
      isSetResult.value = true
      valueAsText.value = obj?.name || ''
    } else {
      console.log('init reset obj', suggestion)
      isNotFound.value = false
      valueAsText.value = ''
    }
  } else {
    isNotFound.value = false
    valueAsText.value = ''
  }
}

function onFocusLost() {
  if (valueAsText.value !== props.modelValue?.name) {
    emit('update:modelValue', null)
  }
}

const suggestions = ref([])

let timer: ReturnType<typeof setTimeout>
const delay = 250

const querying = (query: string) => {
  clearTimeout(timer)
  if (query) {
    const text = query
    timer = setTimeout(() => {
      props.store.search(query).then((list) => {
        console.log('search result', text === valueAsText.value, list)
        if (text === valueAsText.value) {
          suggestions.value = list
        }
      })
    }, delay)
  } else {
    suggestions.value = []
  }
}

function setResult(suggestion: Suggestion | null) {
  isOpen.value = false
  isSetResult.value = true
  valueAsText.value = suggestion?.name ?? ''
  emit('update:modelValue', suggestion)
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
        v-model="valueAsText"
        v-on:blur="onFocusLost"
      />
    </div>
    <div
      v-if="isOpen && !isSetResult && suggestions"
      class="absolute z-50 w-full max-h-72 p-1 glass border rounded-lg overflow-hidden overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full"
      style="display: block; margin-bottom: 5px"
    >
      <div
        class="cursor-pointer py-2 px-4 w-full text-sm rounded-lg focus:outline-hidden"
        v-for="(suggestion, index) in suggestions"
        :key="suggestion.id"
        :tabindex="index"
        @click="setResult(suggestion)"
      >
        <div class="flex justify-between items-center w-full">
          <span>{{ suggestion.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
