<script setup lang="ts">
defineProps(['label'])
</script>

<template>
  <label class="label">
    <input type="checkbox" class="toggle" />
    <span class="ml-3 text-gray-500">{{ label }}</span>
  </label>
</template>

<style scoped></style>
