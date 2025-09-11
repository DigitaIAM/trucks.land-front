<script setup lang="ts">
const state = ref(null)

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

function resetAndShow(id: number) {
  // console.log('resetAndShow', id)
  state.value = { id: id, name: '?' }
  props.store.resolve(id).then((obj) => {
    if (obj) state.value = obj
  })
}

const label = computed(() => state.value[props.name ?? 'name'])
</script>

<template>
  <TextInput v-if="props.asTextField" disabled v-model:modelValue="label" class="flex w-full" />
  <span v-else>{{ label }}</span>
</template>

<style scoped></style>
