<template>
  <DatePicker v-model="time" time-picker>
    <template #input-icon>
      <img class="input-slot-image" src="./schedule.svg" />
    </template>
  </DatePicker>
</template>

<script setup>
import { ref } from 'vue'
import DatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

const time = ref({
  hours: new Date().getHours(),
  minutes: new Date().getMinutes(),
})
</script>

<style>
.input-slot-image {
  height: 20px;
  width: auto;
  margin-left: 5px;
}
</style>
