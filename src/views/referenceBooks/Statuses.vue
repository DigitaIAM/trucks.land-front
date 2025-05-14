<script>
import ListStatuses from '@/components/lists/ListStatuses.vue'
import Search from '@/components/windowElements/Search.vue'
import StatusModal from '@/components/modal/StatusModal.vue'

export default {
  components: {
    StatusModal,
    Search,
    ListStatuses,
  },
  methods: {
    showModal: function () {
      this.$refs.modal.show = true
    },
  },
}
</script>

<template>
  <div class="flex flex-row pb-6">
    <div class="flex-1/2 text-3xl text-gray-700 font-bold">
      <h1>Statuses</h1>
    </div>
    <div>
      <Search></Search>
    </div>
    <div class="flex-none px-10">
      <button
        class="show-modal-button w-40 h-10 bg-[#313EC6] hover:bg-blue-500 text-white text-lg font-normal rounded-xl"
        @click="showModal"
      >
        Create
      </button>
    </div>
  </div>

  <ListStatuses></ListStatuses>

  <status-modal ref="modal"></status-modal>
</template>

<style scoped></style>
