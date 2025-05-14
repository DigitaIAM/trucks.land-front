<script>
import Search from '@/components/windowElements/Search.vue'
import ListUsers from '@/components/lists/ListUsers.vue'
import UserModal from '@/components/modal/UserModal.vue'

export default {
  components: {
    ListUsers,
    Search,
    UserModal,
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
      <h1>Accounts</h1>
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

  <ListUsers></ListUsers>

  <user-modal ref="modal"></user-modal>
</template>

<style scoped></style>
