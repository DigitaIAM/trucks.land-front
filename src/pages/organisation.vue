<route lang="yaml">
# @formatter:off
meta:
  layout: clean
</route>

<script setup lang="ts">
const router = useRouter()
const organizationsStore = useOrganizationsStore()
</script>

<template>
  <div class="flex text-3xl p-8 font-bold pb-10">
    <h1>Organizations</h1>
  </div>

  <div class="flex space-x-8 px-8">
    <div
      v-for="organization in organizationsStore.listing"
      :key="organization.id"
      @click="router.replace({ path: `/${organization.code3}/order/all` })"
    >
      <div
        class="size-36 place-items-center p-4 space-y-1 bg-white cursor-pointer border border-gray-300 rounded-lg transform transition-all hover:scale-105"
      >
        <img class="size-28" :src="organization.url_logo" alt="" />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
