<script setup lang="ts">
defineProps(['id', 'label', 'value'])
</script>

<template>
  <div class="relative">
    <input
      type="text"
      :id="id"
      class="px-2.5 pb-2.5 pt-5 appearance-none block w-full bg-slate-200 text-gray-700 border border-gray-200 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
      placeholder=" "
      :value="value"
    />
    <label
      :for="id"
      class="absolute text-sm text-gray-700 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] start-2.5 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto"
    >
      {{ label }}
    </label>
  </div>
</template>
