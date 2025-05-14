<route lang="yaml">
meta:
layout: app
</route>

<script setup lang="ts">
// import Search from '@/components/windowElements/Search.vue'
// import ListStatuses from '@/components/lists/ListStatuses.vue'

const statusesStore = useStatusesStore()

function createStatus(data) {
  console.log('createStatus', data)
  statusesStore.create(data)
}
</script>

<template>
  <div class="flex px-10">
    <button class="btn" onclick="modal_status.showModal()">Create</button>
    <dialog id="modal_status" class="modal">
      <div class="modal-box w-11/12 max-w-5xl">
        <StatusModal @create="createStatus" />
        <!--        <div class="modal-action">-->
        <!--          <form method="dialog">-->
        <!--            <button class="btn">Done</button>-->
        <!--          </form>-->
        <!--        </div>-->
      </div>
    </dialog>
  </div>

  <ListStatuses />

  <!--  <Flex col items-center justify-center class="h-[32rem] gap-2 text-center">-->
  <!--    <div>Loading {{ statusesStore.loading }}</div>-->
  <!--    &lt;!&ndash;      <div>Error {{ statusesStore.isError }}</div>&ndash;&gt;-->
  <!--    <div>Listing {{ statusesStore.listing }}</div>-->

  <!--    <div v-for="status in statusesStore.listing" :key="status.id">-->
  <!--      <div>{{ status.id }}</div>-->
  <!--      <div>{{ status.name }}</div>-->
  <!--      <div>{{ status.createAt }}</div>-->
  <!--    </div>-->
  <!--  </Flex>-->
</template>
