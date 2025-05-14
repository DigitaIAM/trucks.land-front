<script setup lang="ts">
defineProps(['id', 'label', 'value', 'name'])
</script>

<template>
  <div class="flex py-2">
    <div class="flex items-center me-3">
      <input
        :id="id"
        type="radio"
        :value="value"
        :name="name"
        class="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
      />
      <label :for="id" class="text-nowrap ms-2 text-sm text-gray-900">{{ label }}</label>
    </div>
  </div>
</template>

<style scoped></style>
