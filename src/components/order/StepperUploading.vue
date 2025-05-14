<script setup lang="ts">
const stages = [
  { label: 'RC', check: true },
  { label: 'BOL', check: true },
  { label: 'POD', check: false },
]
</script>

<template>
  <div class="flex">
    <label for="dropzone-file" class="flex">
      <div class="w-40 pb-10">
        <div class="relative flex justify-between w-full">
          <div class="absolute top-2/4 h-0.5 w-full bg-gray-500"></div>
          <div
            v-for="stage in stages"
            class="relative z-8 grid w-8 h-8 font-bold text-white transition-all duration-300 bg-gray-500 rounded-full place-items-center"
          >
            <svg
              v-if="stage.check"
              class="w-5 h-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            <div class="absolute -bottom-[1.5rem] w-max text-center">
              <h6
                class="block text-base font-semibold leading-relaxed tracking-normal text-gray-400"
              >
                {{ stage.label }}
              </h6>
            </div>
          </div>
        </div>
      </div>
      <input id="dropzone-file" type="file" class="hidden" />
    </label>
  </div>
</template>

<style scoped></style>
