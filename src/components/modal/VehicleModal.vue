<script>
import FormInputField from '@/components/order/FormInputField.vue'
import ToggleDescription from '@/components/buttons/ToggleDescription.vue'
import RadioVertical from '@/components/buttons/RadioVertical.vue'
import DatePicker from '@/components/picker/DatePicker.vue'

export default {
  name: 'VehicleModal',
  components: { DatePicker, RadioVertical, ToggleDescription, FormInputField },
  data: function () {
    return {
      show: false,
    }
  },
  methods: {
    closeModal: function () {
      this.show = false
    },
  },
}
</script>

<template>
  <div v-if="show" class="modal-shadow" @click.self="closeModal">
    <div class="modal">
      <div class="flex items-start justify-between p-2">
        <div>
          <h5 class="text-gray-700 text-xl font-bold">Vehicle</h5>
        </div>

        <div
          class="relative h-8 max-h-[32px] w-8 max-w-[32px] select-none rounded-lg text-center align-middle font-sans text-xs font-medium uppercase text-blue-gray-500 transition-all hover:bg-blue-gray-500/10 active:bg-blue-gray-500/30 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
          @click="closeModal"
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
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </span>
        </div>
      </div>
      <div class="flex flex-wrap mb-6 w-full">
        <div class="md:w-1/2 px-3 md:mb-0">
          <FormInputField id="unit" label="Unit ID" value="V2815" />
        </div>
        <div class="md:w-1/4 px-3 md:mb-0">
          <RadioVertical></RadioVertical>
        </div>
        <div class="md:w-1/4 px-3 md:mb-0">
          <ToggleDescription label="active"></ToggleDescription>
        </div>
      </div>
      <div class="mb-2 px-3 md:mb-0">
        <FormInputField id="owner" label="Owner" value="" />
      </div>

      <div class="flex flex-wrap mb-2 mt-6 w-full">
        <div class="md:w-1/2 px-3 md:mb-0">
          <FormInputField id="vin" label="VIN" value="1FDSF6PG1PKB32014" />
        </div>
        <div class="md:w-1/2 px-3 md:mb-0">
          <DatePicker></DatePicker>
        </div>
      </div>
      <div class="flex flex-wrap mb-4 mt-6 w-full">
        <div class="md:w-1/4 px-3 md:mb-0">
          <FormInputField id="model" label="Model" value="Transit" />
        </div>
        <div class="md:w-1/4 px-3 md:mb-0">
          <FormInputField id="type" label="Type" value="small straight" />
        </div>
        <div class="md:w-1/4 px-3 md:mb-0">
          <FormInputField id="color" label="Color" value="white" />
        </div>
        <div class="md:w-1/4 px-3 md:mb-0">
          <FormInputField id="year" label="Year" value="2023" />
        </div>
      </div>
      <div class="flex flex-wrap mb-4 mt-4 w-full">
        <div class="md:w-1/2 md:mb-0">
          <h5 class="text-gray-500 px-3">Cargo compartment</h5>
        </div>
        <div class="md:w-1/2 px-3 md:mb-0">
          <h5 class="text-gray-500 px-3">it's dimensions</h5>
        </div>
      </div>
      <div class="flex flex-wrap mb-4 mt-4 w-full">
        <div class="md:w-1/4 px-3 md:mb-0">
          <FormInputField id="load capacity" label="Load capacity" value="4000" />
        </div>
        <div class="md:w-1/4 px-3 md:mb-0">
          <FormInputField id="length" label="Length" value="160" />
        </div>
        <div class="md:w-1/4 px-3 md:mb-0">
          <FormInputField id="width" label="Width" value="97" />
        </div>
        <div class="md:w-1/4 px-3 md:mb-0">
          <FormInputField id="height" label="Height" value="93" />
        </div>
      </div>
      <div class="flex flex-wrap mb-4 mt-4 w-full">
        <div class="md:w-1/5 md:mb-0">
          <h5 class="text-gray-500 px-3">and door</h5>
        </div>
        <div class="md:w-2/5 px-3 md:mb-0">
          <FormInputField id="width" label="Width" value="97" />
        </div>
        <div class="md:w-2/5 px-3 md:mb-0">
          <FormInputField id="height" label="Height" value="93" />
        </div>
      </div>
      <div class="grid grid-cols-1 place-items-end px-3 mt-6 mb-2">
        <button
          class="w-20 h-10 bg-[#68C3A8] hover:bg-[#059669] text-white rounded-xl transition duration-300"
          @click="closeModal"
        >
          Done
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-shadow {
  position: absolute;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  backdrop-filter: blur(var(--blur-2xl));
}

.modal {
  background: #fff;
  border-radius: 8px;
  padding: 15px;
  min-width: 540px;
  max-width: 600px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
