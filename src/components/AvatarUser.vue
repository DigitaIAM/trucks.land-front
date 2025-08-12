<script setup lang="ts">

const props = defineProps<{
  username?: string
}>()


const firstLetter = computed(() => props.username?.charAt(0).toUpperCase())

const bgColor = computed(() => {
  const hash = props.username?.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc)
  }, 0)
  return `hsl(${hash % 360}, 50%, 70%)`
})

const textColor = '#E0E0E0'
</script>

<template>
  <div class="avatar" :style="{ backgroundColor: bgColor, color: textColor }">
    {{ firstLetter }}
  </div>
</template>

<style scoped>
.avatar {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 20px;
  font-weight: bold;
  user-select: none; /* Предотвратить выделение текста */
}
</style>
