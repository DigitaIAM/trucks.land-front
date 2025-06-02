<script>
import ListForDispatcher from '@/components/lists/ListForDispatcher.vue'
import Search from '@/components/windowElements/Search.vue'

export default {
  components: {
    Search,
    ListForDispatcher,
  },
  methods: {
    showModal: function () {
      this.$refs.modal.show = true
    },
  },
}
</script>

<template>
  <div class="flex flex-row gap-6 px-4 mb-2 mt-3">
    <Search></Search>
    <Button class="btn" @click="resetAndShow(null)">Create</Button>
  </div>
  <ListForDispatcher></ListForDispatcher>
</template>

<style scoped></style>
