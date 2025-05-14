<template>
  <div class="flex flex-row w-full h-full">
    <div class="flex flex-wrap">
      <div class="flex-1/2 text-3xl text-gray-700 font-bold">
        <h1>Order</h1>
      </div>
      <div class="flex-1/60">
        <StepperUploading></StepperUploading>
      </div>
      <div>
        <FormOrder></FormOrder>
      </div>
    </div>
    <div class="w-full flex-col">
      <div class="px-10">
        <StepperStates></StepperStates>
      </div>
      <div class="w-full">
        <div class="px-10">
          <Comments></Comments>
        </div>
      </div>

      <!--      <div>-->
      <!--        <button class="w-48 h-12 bg-blue-400 hover:bg-blue-600 text-white text-lg rounded-xl transition duration-300">-->
      <!--        Invoices-->
      <!--      </button>-->
      <!--      </div>-->
    </div>
  </div>
</template>

<style></style>

<script setup lang="ts">
import FormOrder from '@/components/order/FormOrder.vue'
import StepperUploading from '@/components/order/StepperUploading.vue'
import StepperStates from '@/components/order/StepperStates.vue'
import Comments from '@/components/order/Comments.vue'
</script>
