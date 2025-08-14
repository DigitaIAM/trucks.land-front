<script setup lang="ts">
const state = ref(null)

const props = defineProps<{
  id: string | number | null
  store: Searchable
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
    // console.log('resolve', obj, obj.name)
    state.value = obj
  })
}
</script>

<template>
  <slot :user="state"></slot>
</template>

<style scoped></style>
