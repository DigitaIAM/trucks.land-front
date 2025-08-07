<script setup lang="ts">
import { RouterView } from 'vue-router'

const authStore = useAuthStore()
</script>

<template>
  <RouterView v-if="authStore.isInitDone" />
  <Loading v-else />
</template>

<style scoped></style>
