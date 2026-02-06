<route lang="yaml">
# @formatter:off
meta:
  layout: clean
</route>

<script setup lang="ts">
import type { AccessMatrix } from '@/stores/access_matrix.ts'
import { groupBy } from '@/utils/group-by.ts'
const router = useRouter()

const authStore = useAuthStore()
const organizationsStore = useOrganizationsStore()

const list = computedAsync(async () => {
  const user = authStore.user
  if (user) {
    const orgs = organizationsStore.listing
    if (orgs && orgs.length > 0) {
      const { data } = await supabase
        .from('access_matrix')
        .select()
        .in(
          'organization',
          orgs.map((org) => org.id),
        )
        .eq('user_uuid', user.id)

      const mapping = groupBy(data?.map((v) => v as AccessMatrix) ?? [], (v) => v.organization)

      return orgs.map((org) => {
        let url = `/access-denied`

        const accesses = mapping.get(org.id)
        if (accesses && accesses.length > 0) {
          const access = accesses[0]
          if (access) {
            const code = org.code3.toLowerCase()

            if (access.is_admin) {
              url = `/${code}/order/all`
            } else if (access.is_dispatcher) {
              url = `/${code}/order/dispatcher`
            } else if (access.is_tracking) {
              url = `/tracking`
            } else if (access.is_accountant) {
              url = `/${code}/journals/incomeView`
            } else if (access.is_hr) {
              url = `/${code}/hr/tasks`
            }
          }
        }

        return { org: org, url: url }
      })
    }
  }
  return []
}, [])

// function generateUrlFor(org: Organization) {
//
// }
</script>

<template>
  <div class="flex text-3xl p-8 font-bold pb-10">
    <h1>Organizations</h1>
  </div>

  <div class="flex space-x-8 px-8">
    <div v-for="item in list" :key="item.org.id" @click="router.replace({ path: item.url })">
      <div
        class="size-36 place-items-center p-4 space-y-1 bg-white cursor-pointer border border-gray-300 rounded-lg transform transition-all hover:scale-105"
      >
        <img class="size-28" :src="item.org.url_logo" alt="" />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
