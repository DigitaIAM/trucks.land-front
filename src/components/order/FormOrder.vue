<script setup lang="ts">
import FormField from '@/components/order/FormField.vue'
import FormComboField from '@/components/order/FormComboField.vue'
import FormInputField from '@/components/order/FormInputField.vue'
import NextStatus from '@/components/order/NextStatus.vue'
import ToggleDescription from '@/components/buttons/ToggleDescription.vue'
</script>

<template>
  <form class="bg-white rounded-xl shadow-sm w-[90vw] md:w-[50vw] p-4">
    <div class="flex flex-wrap mb-2 w-full">
      <div class="md:w-1/2 px-3 md:mb-0">
        <NextStatus
          id="status"
          label="Status"
          :value="{ label: 'Loading stage' }"
          :options="[{ label: 'Loading stage' }, { label: 'Cancel' }, { label: 'TONU' }]"
        ></NextStatus>
      </div>

      <div class="ml-auto px-3">
        <ToggleDescription label="excluded from calculation with dispatcher"></ToggleDescription>
      </div>
    </div>

    <div class="flex flex-wrap mb-2 mt-6 w-full">
      <div class="md:w-1/4 px-3 md:mb-0">
        <FormField id="number" label="Number" value="C1 - 2622" />
      </div>
      <div class="md:w-1/4 px-3 md:mb-0">
        <FormField id="dispatcher" label="Dispatcher" value="Tom Jones" />
      </div>
      <div class="md:w-1/4 px-3 md:mb-0">
        <FormInputField id="posted" label="Posted loads ID" value="335034" />
      </div>
      <div class="md:w-1/4 px-3 md:mb-0">
        <FormInputField id="refs" label="Refs" value="5983794" />
      </div>
    </div>

    <div class="flex flex-wrap mb-2 mt-6 w-full">
      <div class="md:w-1/2 px-3 md:mb-0">
        <FormComboField
          id="organization"
          label="Organization"
          :value="{ label: 'CNU Logistics' }"
          :options="[{ label: 'CNU Logistics' }, { label: 'Cancel' }, { label: 'TONU' }]"
        />
      </div>
      <div class="md:w-1/2 px-3 md:mb-0">
        <FormComboField
          id="broker"
          label="Broker"
          :value="{ label: 'Nolan Transportation Group INC' }"
          :options="[
            { label: 'Nolan Transportation Group INC' },
            { label: 'Cancel' },
            { label: 'TONU' },
          ]"
        />
      </div>
    </div>

    <div class="flex flex-wrap mb-2 mt-6 w-full">
      <div class="md:w-1/5 px-3 md:mb-0">
        <FormInputField id="pieces" label="Total pieces" value="3" />
      </div>
      <div class="md:w-1/5 px-3 md:mb-0">
        <FormInputField id="weight" label="Total weight" value="1620" />
      </div>
      <div class="md:w-1/5 px-3 md:mb-0">
        <FormInputField id="miles" label="Total miles" value="335" />
      </div>
      <div class="md:w-1/5 px-3 md:mb-0">
        <FormInputField id="cost" label="Cost $" value="550" />
      </div>
      <div class="md:w-1/5 px-2 md:mb-0">
        <FormField id="payment" label="Driver payment $" value="400" />
      </div>
    </div>

    <div class="flex flex-wrap mb-2 mt-6 w-full">
      <div class="md:w-1/3 px-3 md:mb-0">
        <FormField id="driver" label="Driver" value="Oleksandr Strelbitskyi" />
      </div>
      <div class="md:w-1/3 px-3 md:mb-0">
        <FormField id="vehicle" label="Vehicle" value="V2609 Aleks Trucking LLC (CNU)" />
      </div>
      <div class="md:w-1/5 px-2 md:mb-0">
        <FormField id="payment" label="Driver payment $" value="200" />
      </div>
      <button type="button" class="text-gray-700 cursor-pointer font-medium rounded-lg text-sm">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="size-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"
          />
        </svg>
      </button>
    </div>

    <div class="flex flex-wrap mb-2 mt-6 w-full">
      <div class="md:w-1/3 px-3 md:mb-0">
        <FormField id="driver" label="Driver" value="Andriy Mykhaylivskyy" />
      </div>
      <div class="md:w-1/3 px-3 md:mb-0">
        <FormField id="vehicle" label="Vehicle" value="V883 Amy Trans LLC" />
      </div>
      <div class="md:w-1/5 px-2 md:mb-0">
        <FormField id="payment" label="Driver payment $" value="200" />
      </div>
      <button type="button" class="text-gray-700 cursor-pointer font-medium rounded-lg text-sm">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="size-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"
          />
        </svg>
      </button>
    </div>
  </form>
</template>

<style scoped></style>
