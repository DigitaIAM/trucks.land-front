<script setup lang="ts">
import { defineProps, defineEmits, ref } from 'vue'
import FormInputField from '@/components/order/FormInputField.vue'

import TimePicker from '@/components/picker/TimePicker.vue'
import DatePicker from '@/components/picker/DatePicker.vue'
import RadioButton from '@/components/buttons/RadioButton.vue'
// import { onClickOutside } from '@vueuse/core'

const props = defineProps({
  isOpen: Boolean,
})

const emit = defineEmits(['modal-close'])

// const target = ref(null)
// onClickOutside(target, () => emit('modal-close'))
</script>

<template>
  <div v-if="isOpen" class="modal-mask">
    <div class="modal-wrapper">
      <div
        ref="target"
        class="relative m-auto my-50 p-4 w-2/5 min-w-[40%] max-w-[40%] rounded-lg bg-white shadow-sm"
      >
        <div class="flex items-start justify-between p-2">
          <div>
            <h5 class="text-gray-700 text-xl font-bold">Delivery</h5>
          </div>
          <div class="flex items-center justify-between">
            <RadioButton id="radio-1" label="Normal" value="" name="group-1"></RadioButton>
            <RadioButton id="radio-2" label="Direct" value="" name="group-1"></RadioButton>
          </div>
          <button
            @click="() => emit('modal-close')"
            data-ripple-dark="true"
            data-dialog-close="true"
            class="relative h-8 max-h-[32px] w-8 max-w-[32px] select-none rounded-lg text-center align-middle font-sans text-xs font-medium uppercase text-blue-gray-500 transition-all hover:bg-blue-gray-500/10 active:bg-blue-gray-500/30 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
            type="button"
          >
            <span class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
                class="h-5 w-5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </span>
          </button>
        </div>

        <div class="w-full px-3">
          <FormInputField id="note" label="Note" value="Must check in as CNU / PU#621772623" />
        </div>

        <div class="flex flex-wrap mb-2 mt-6 w-full">
          <div class="md:w-1/2 px-3 md:mb-0">
            <FormInputField id="address1" label="Address 1" value="EXHIBIT CONCEPTS" />
          </div>
          <div class="md:w-1/2 px-3 md:mb-0">
            <FormInputField id="address2" label="Address 2" value="700 CROSSROADS CT" />
          </div>
        </div>
        <div class="flex flex-wrap mb-2 mt-6 w-full">
          <div class="md:w-1/2 px-3 md:mb-0">
            <FormInputField id="city" label="City / town" value="VANDALIA" />
          </div>
          <div class="md:w-1/4 px-3 md:mb-0">
            <FormInputField id="state" label="State" value="OH" />
          </div>
          <div class="md:w-1/4 px-3 md:mb-0">
            <FormInputField id="zip" label="Zip" value="59837" />
          </div>
        </div>

        <div class="flex flex-wrap mb-2 mt-6 w-full">
          <div class="md:w-1/3 px-3 md:mb-0">
            <DatePicker></DatePicker>
          </div>
          <div class="md:w-1/3 px-3 md:mb-0">
            <TimePicker></TimePicker>
          </div>
          <div class="md:w-1/3 px-3 md:mb-0">
            <p class="">Completed</p>
            <div class="flex justify-items-start">
              <RadioButton id="radio-3" label="on time" value="" name="group-2"></RadioButton>
              <RadioButton id="radio-4" label="behind time" value="" name="group-2"></RadioButton>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 place-items-end px-3">
          <button
            @click="() => emit('modal-close')"
            class="w-20 h-10 bg-[#68C3A8] hover:bg-[#059669] text-white rounded-xl transition duration-300"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  //background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(var(--blur-2xl));
}

.modal-container {
  width: 600px;
  margin: 150px auto;
  padding: 20px 30px;
  background-color: #fff;
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
