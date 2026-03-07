<script setup lang="ts">
const state = ref<object>({})
const label = ref<string>('')

const props = defineProps<{
  id: string | number | null | undefined
  store: Searchable
  asTextField?: boolean
  name?: string | null
}>()

watch(
  () => props.id,
  (id) => {
    try {
      // console.log('watch id', id, props.id)
      if (id) {
        resetAndShow(id)
      }
    } catch (e) {
      console.log('error', r)
    }
  },
  { deep: true },
)

resetAndShow(props.id)

async function resetAndShow(id: string | number | null | undefined) {
  // console.log('resetAndShow', id)
  state.value = {}
  label.value = ''

  if (id) {
    const obj = await props.store.resolve(id)
    if (obj) {
      state.value = obj
      label.value = obj[props.name ?? 'name']
    } else {
      state.value = { id: id, name: '' }
      label.value = ''
    }
  }
}

// const label = computed(() => (state.value == null ? '' : state.value[props.name ?? 'name']))
</script>

<template>
  <TextInput v-if="props.asTextField" disabled v-model:modelValue="label" class="flex w-full" />
  <span v-else>{{ label }}</span>
</template>

<style scoped></style>
