<script setup lang="ts">
import SearchAndCreate from '@/components/windowElements/Search.vue'
import ListOfOrdersQuick from '@/components/lists/ListOfOrdersQuick.vue'
import Search from '@/components/windowElements/Search.vue'
</script>

<template>
  <div class="flex flex-row pb-6">
    <div>
      <Search></Search>
    </div>
  </div>
  <ListOfOrdersQuick></ListOfOrdersQuick>
</template>

<style scoped></style>
