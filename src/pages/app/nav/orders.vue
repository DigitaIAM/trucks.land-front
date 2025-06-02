<template>
  <div class="flex flex-row gap-6 px-4 mb-2 mt-3">
    <Search></Search>
    <Button class="btn" @click="resetAndShow(null)">Create</Button>
  </div>
  <ListOfOrders />
</template>

<style></style>

<script>
export default {
  components: {
    Search,
    ListOfOrders,
  },
  methods: {
    showModal: function () {
      this.$refs.modal.show = true
    },
  },
}
import ListOfOrders from '@/components/lists/ListOfOrders.vue'
import Search from '@/components/windowElements/Search.vue'
</script>
