<script setup lang="ts">
import { defineEmits, ref } from 'vue'

const emit = defineEmits(['pick-up', 'delivery', 'changeDriver'])

const dropdownToggle = ref(null)
const dropdownMenu = ref(null)

// let dropdownToggle = document.getElementById('dropdownToggle')
// let dropdownMenu = document.getElementById('dropdownMenu')

function toggleDropdown() {
  dropdownMenu.value?.classList.toggle('hidden')
  dropdownMenu.value?.classList.toggle('block')
}

function hideDropdown() {
  dropdownMenu.value?.classList.add('hidden')
  dropdownMenu.value?.classList.remove('block')
}

// dropdownToggle.addEventListener('click', (event) => {
//   event.stopPropagation() // Prevents triggering document click
//   toggleDropdown()
// })
//
// // Hide dropdown when <li> is clicked
// dropdownMenu.querySelectorAll('.dropdown-item').forEach((li) => {
//   li.addEventListener('click', () => {
//     hideDropdown()
//   })
// })

// Hide dropdown when clicking outside
document.addEventListener('click', (event) => {
  if (!dropdownMenu.value?.contains(event.target) && event.target !== dropdownToggle.value) {
    hideDropdown()
  }
})
</script>

<template>
  <div class="relative w-max mx-auto">
    <button
      type="button"
      ref="dropdownToggle"
      class="px-5 py-2.5 grow-0 bg-[#313EC6] hover:bg-blue-500 text-white rounded-xl transition duration-300"
      @click="toggleDropdown"
    >
      Add
    </button>

    <ul
      ref="dropdownMenu"
      class="absolute right-0 hidden bg-white py-2 min-w-full w-max rounded-xl max-h-96 shadow-sm"
    >
      <li
        @click="
          () => {
            hideDropdown()
            emit('pick-up')
          }
        "
        class="dropdown-item py-2.5 px-5 hover:bg-blue-50 text-slate-900 cursor-pointer"
      >
        Pick up
      </li>
      <li
        @click="
          () => {
            hideDropdown()
            emit('delivery')
          }
        "
        class="dropdown-item py-2.5 px-5 hover:bg-blue-50 text-slate-900 cursor-pointer"
      >
        Delivery
      </li>
      <li class="dropdown-item py-2.5 px-5 hover:bg-blue-50 text-slate-900 cursor-pointer">
        Vehicle breakdown
      </li>
      <li
        @click="
          () => {
            hideDropdown()
            emit('changeDriver')
          }
        "
        class="dropdown-item py-2.5 px-5 hover:bg-blue-50 text-slate-900 cursor-pointer"
      >
        Change of driver and vehicle
      </li>
    </ul>
  </div>
</template>
