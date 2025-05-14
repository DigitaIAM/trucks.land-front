<template>
  <DatePicker v-model="date" :enable-time-picker="false">
    <template #input-icon>
      <img class="input-slot-image" src="./calendar.svg" />
    </template>
  </DatePicker>
</template>

<script setup>
import { ref } from 'vue'
import DatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

const date = ref()
</script>

<style>
.input-slot-image {
  height: 20px;
  width: auto;
  margin-left: 5px;
}
</style>
