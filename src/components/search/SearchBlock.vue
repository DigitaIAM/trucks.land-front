<script setup lang="ts">
import { defineProps } from 'vue'

const props = defineProps<{
  id: string
  label: string
  items: Array
  value?: (a: any) => string
}>()

const emit = defineEmits(['click'])
</script>

<template>
  <div v-if="items.length > 0">
    <div class="p-3 uppercase font-thin tracking-wider">{{ props.label }}</div>
    <div
      class="cursor-pointer px-3 py-2 w-full text-sm rounded-lg hover:bg-base-100"
      v-for="(item, index) in props.items"
      :key="props.id + '_' + item.id"
      :tabindex="index"
      @click="emit('click', id, item)"
    >
      {{ value == null ? item.name : value(item) }}
    </div>
  </div>
</template>

<style scoped></style>
