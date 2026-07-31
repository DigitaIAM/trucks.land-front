<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useIsDataLoading } from 'unplugin-vue-router/data-loaders'

const authStore = useAuthStore()
const dataLoading = useIsDataLoading()

const isLoading = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
watch(
  dataLoading,
  (loading) => {
    clearTimeout(timer)
    if (loading) timer = setTimeout(() => (isLoading.value = true), 300)
    else isLoading.value = false
  },
  { immediate: true },
)
</script>

<template>
  <RouterView v-if="authStore.isInitDone" />
  <Loading v-else />

  <div v-if="isLoading" class="fixed inset-0 z-50 flex items-center justify-center bg-base-100/70">
    <Flex col items-center gap-2>
      <LoadingRing lg />
      <Text size="lg">Loading…</Text>
    </Flex>
  </div>
</template>

<style scoped></style>
