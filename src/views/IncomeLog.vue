<script setup lang="ts">
import SearchAndCreate from '@/components/windowElements/Search.vue'
import ListOfOrdersIncome from '@/components/lists/ListOfOrdersIncome.vue'
import Search from '@/components/windowElements/Search.vue'
</script>

<template>
  <div class="flex flex-row pb-6">
    <div>
      <Search></Search>
    </div>
  </div>
  <ListOfOrdersIncome></ListOfOrdersIncome>
</template>

<style scoped></style>
