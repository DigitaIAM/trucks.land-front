<script setup lang="ts">
import List from '@/components/lists/ListOfTracking.vue'
import Search from '@/components/windowElements/Search.vue'
</script>

<template>
  <div class="flex flex-row gap-6 px-4 mb-2 mt-3">
    <Search></Search>
    <Button class="btn" @click="resetAndShow(null)">Create</Button>
  </div>
  <List></List>
</template>

<style scoped></style>
