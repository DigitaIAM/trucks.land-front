<route lang="yaml">
# @formatter:off
meta:
layout: order-view
</route>

<script lang="ts">
import { defineBasicLoader } from 'unplugin-vue-router/data-loaders/basic'

const organizationsStore = useOrganizationsStore()
const authStore = useAuthStore()

export const useOrgData = defineBasicLoader(
  'oid',
  async (route) => {
    const org = await organizationsStore.resolve3(route.params.oid)
    authStore.org = org
    return org
  },
  { key: 'org' },
)
</script>

<script setup lang="ts">
defineOptions({
  __loaders: [useOrgData],
})

const policy_number = ref('')
const start_date = ref(new Date() as Date | undefined)
const end_date = ref(new Date() as Date | undefined)

const insurancesStore = useInsuranceStore()

const route = useRoute()

watch(
  () => route.params.id,
  (id) => {
    // console.log('watch id', id, props.id)
    resetAndShow(id)
  },
  { deep: true },
)

resetAndShow(route.params.id)

async function resetAndShow(str: string) {
  const id = Number(str)
  const insurance = await insurancesStore.resolve(id)

  if (insurance) {
    policy_number = policy_number.value
    start_date = start_date.value
    end_date = end_date.value
  } else {
    // TODO show error
  }
}
</script>

<template></template>

<style scoped></style>
