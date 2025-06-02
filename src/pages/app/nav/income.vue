<script setup lang="ts">
import SearchAndCreate from '@/components/windowElements/Search.vue'
import ListOfOrdersIncome from '@/components/lists/ListOfOrdersIncome.vue'
import Search from '@/components/windowElements/Search.vue'
</script>

<template>
  <div class="flex flex-row gap-6 px-4 mb-2 mt-3">
    <Search></Search>
    <Button class="btn" @click="resetAndShow(null)">Create</Button>
  </div>
  <ListOfOrdersIncome></ListOfOrdersIncome>
</template>

<style scoped></style>
