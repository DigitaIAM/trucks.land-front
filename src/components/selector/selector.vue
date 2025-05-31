<script setup lang="ts">
export type Suggestion = {
  id: number
  name: string
}

interface Searchable {
  resolve(id: number): Suggestion

  search(query: string): Suggestion[]
}

const props = defineProps<{
  modelValue?: Suggestion | null
  store: Searchable
  label?: string
}>()

const emit = defineEmits(['update:modelValue', 'build'])

const isOpen = ref(false)
const isSetResult = ref(false)

const valueAsText = ref(props.modelValue?.name || '')
const label = ref(props.label)

watch(
  () => props.modelValue,
  (suggestion) => {
    if (suggestion) {
      const obj = props.store.resolve(suggestion.id)
      isSetResult.value = true
      valueAsText.value = obj?.name || '???'
    } else {
      valueAsText.value = ''
    }
  },
)

watch(
  () => valueAsText.value,
  (value) => {
    if (isSetResult.value) {
      isSetResult.value = false
      suggestions.value = []
    } else {
      querying(value)
      isOpen.value = value !== ''
    }
  },
)

const suggestions = ref([])

let timer: ReturnType<typeof setTimeout>
const delay = 300

const querying = (query) => {
  clearTimeout(timer)
  if (query) {
    const text = query
    timer = setTimeout(() => {
      props.store.search(query).then((list) => {
        if (text === valueAsText.value) {
          suggestions.value = list
        }
      })
    }, delay)
  } else {
    suggestions.value = []
  }
}

function setResult(suggestion: Suggestion) {
  isOpen.value = false
  isSetResult.value = true
  valueAsText.value = suggestion.name
  emit('update:modelValue', suggestion)
}
</script>

<template>
  <div class="relative">
    <div class="relative">
      <TextInput
        :placeholder="label"
        v-model="valueAsText"
        aria-expanded="false"
        class="block w-full disabled:opacity-50 disabled:pointer-events-none"
      ></TextInput>

      <div class="absolute top-1/2 end-3 -translate-y-1/2" aria-expanded="false">
        <svg
          class="shrink-0 size-3.5"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m7 15 5 5 5-5"></path>
          <path d="m7 9 5-5 5 5"></path>
        </svg>
      </div>
    </div>
    <!-- style="display: none" -->
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

<style lang="postcss" scoped></style>
