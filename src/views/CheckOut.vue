<script setup lang="ts">
import ListOfOrdersCheckOut from '@/components/lists/ListOfOrdersCheckOut.vue'
import Search from '@/components/windowElements/Search.vue'

</script>

<template>
  <div class="flex flex-row pb-6">
    <div>
      <Search></Search>
    </div>
  </div>
  <div class="about">
    <ListOfOrdersCheckOut />
  </div>
</template>

<style scoped></style>
