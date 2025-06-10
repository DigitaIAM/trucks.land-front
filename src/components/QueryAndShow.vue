<script setup lang="ts">
const state = ref('')

const props = defineProps<{
  id: string | number | null
  store: Searchable
  asTextField: boolean
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

function resetAndShow(id: number) {
  // console.log('resetAndShow', id)
  const s = state.value
  if (s) {
    // console.log('return', s)
    return s
  } else {
    const ns = { id: id, name: '?' }
    state.value = ns
    props.store.resolve(id).then((obj) => {
      // console.log('resolve', obj)
      if (obj) state.value = obj
    })
    return ns
  }
}

const label = computed(() => state.value?.name)
</script>

<template>
  <TextInput v-if="props.asTextField" disabled v-model:modelValue="label" />
  <span v-else>{{ label }}</span>
</template>

<style scoped></style>
