<script setup lang="ts">
import SearchAndCreate from '@/components/windowElements/Search.vue'
import List from '@/components/lists/ListOfTracking.vue'
import Search from '@/components/windowElements/Search.vue'
</script>

<template>
  <div class="flex flex-row pb-6">
    <div>
      <Search></Search>
    </div>
  </div>
  <List></List>
</template>

<style scoped></style>
