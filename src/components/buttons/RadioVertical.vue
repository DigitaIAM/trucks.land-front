<script setup lang="ts"></script>

<template>
  <div class="flex items-center">
    <input
      id="default-radio-1"
      type="radio"
      value=""
      name="default-radio"
      class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
    />
    <label for="default-radio-1" class="text-nowrap ms-2 text-sm text-gray-500">cargo van</label>
  </div>
  <div class="flex items-center">
    <input
      checked
      id="default-radio-2"
      type="radio"
      value=""
      name="default-radio"
      class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
    />
    <label for="default-radio-2" class="text-nowrap ms-2 text-sm text-gray-500"
      >small straight</label
    >
  </div>
  <div class="flex items-center">
    <input
      checked
      id="default-radio-3"
      type="radio"
      value=""
      name="default-radio"
      class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
    />
    <label for="default-radio-3" class="text-nowrap ms-2 text-sm text-gray-500"
      >large straight</label
    >
  </div>
</template>

<style scoped></style>
