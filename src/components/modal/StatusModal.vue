<script setup>
import { defineModel } from 'vue'
// import ColorPicker from '@/components/picker/ColorPicker.vue'

// export default defineComponent({
//   components: { ColorPicker },
// })

const name = ref('')
const color = ref(null)
</script>

<template>
  <div>
    <h5 class="px-1 pb-3 text-xl font-bold">Status</h5>
  </div>
  <h5 class="text-gray-500 px-1 pb-1">Name</h5>
  <div class="flex mb-2 w-full">
    <div class="md:w-1/2 md:mb-0">
      <TextInput v-model="name" />
    </div>
    <div class="md:w-1/2 md:mb-0">
      <ColorPicker v-model="color" />
    </div>
  </div>

  <!--  <h5 class="text-gray-500 px-1 pb-1 pt-2">Next statuses</h5>-->
  <!--  <div class="flex gap-4 mb-4 w-full">-->
  <!--    <div class="md:w-1/3 md:mb-0">-->
  <!--      <TextInput></TextInput>-->
  <!--    </div>-->
  <!--    <div class="md:w-1/3 md:mb-0">-->
  <!--      <TextInput></TextInput>-->
  <!--    </div>-->
  <!--    <div class="md:w-1/3 md:mb-0">-->
  <!--      <TextInput></TextInput>-->
  <!--    </div>-->
  <!--  </div>-->

  <div class="grid grid-cols-2">
    <div class="gap-4 mb-4 w-full">
      <div class="mb-2">
        <ToggleDescription label="start"></ToggleDescription>
      </div>
      <div class="mb-2">
        <ToggleDescription label="end"></ToggleDescription>
      </div>
    </div>

    <div class="gap-4 mb-4 w-full">
      <div class="mb-2">
        <ToggleDescription label="Dispatcher team"></ToggleDescription>
      </div>
      <div class="mb-2">
        <ToggleDescription label="Tracking team"></ToggleDescription>
      </div>
      <div class="mb-2">
        <ToggleDescription label="Check out before payments"></ToggleDescription>
      </div>
      <div class="mb-2">
        <ToggleDescription label="Accounts"></ToggleDescription>
      </div>
      <div class="mb-2">
        <ToggleDescription label="QPay"></ToggleDescription>
      </div>
      <div class="mb-2">
        <ToggleDescription label="Ready for pay out"></ToggleDescription>
      </div>
    </div>

    <Button @click="$emit('create', { name: name, color: color })">Create</Button>
  </div>
</template>

<style scoped></style>
