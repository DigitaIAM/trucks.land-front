<route lang="yaml">
# @formatter:off
meta:
  layout: clean
</route>

<script setup lang="ts">
//const authStore = useAuthStore()
const router = useRouter()
//const useOrganizations = useOrganizationsStore()

const buttons = [
  {
    label: 'Caravan Freight',
    icon: '/src/assets/logo_CAF.jpg',
    link: '/caf/order/all',
  },
  {
    label: 'CVS Logistics',
    icon: '/src/assets/logo_CVS.jpg',
    link: '/cvs/order/all',
  },
  {
    label: 'CNU Logistics',
    icon: '/src/assets/logo_CNU.jpg',
    link: '/cnu/order/all',
  },
]
</script>

<template>
  <div class="flex text-3xl p-8 font-bold pb-10">
    <h1>Organizations</h1>
  </div>

  <div class="flex space-x-8 px-8">
    <div
      v-for="button in buttons"
      :key="button.label"
      @click="router.replace({ path: button.link })"
    >
      <div
        class="size-36 place-items-center p-4 space-y-1 bg-white cursor-pointer border border-gray-300 rounded-lg transform transition-all hover:scale-105"
      >
        <!--        <component :is="button.icon" class="xl"></component>-->
        <img class="size-28" :src="button.icon" alt="" />
      </div>
    </div>
  </div>
</template>

<!--<template>-->
<!--  <Flex items-center justify-center>-->
<!--    <Card class="max-w-xs bg-base-200 mx-auto">-->
<!--      <CardBody class="gap-4">-->
<!--        <Text medium size="2xl">Organization</Text>-->

<!--        <form class="flex flex-col gap-4">-->
<!--          <FormControl class="px-24 mt-2">-->
<!--            &lt;!&ndash;        v-model="authStore.oid"&ndash;&gt;-->
<!--            <Select-->
<!--              :modelValue="authStore.oid"-->
<!--              @update:modelValue="-->
<!--                async (oid) => {-->
<!--                  const org = await useOrganizations.resolve(oid)-->
<!--                  authStore.org = org-->
<!--                  router.replace({ path: '/' + org.code3.toLowerCase() + '/order/all' })-->
<!--                }-->
<!--              "-->
<!--              :options="useOrganizations.listing"-->
<!--              class="select-ghost select-lg w-full max-w-xs"-->
<!--            />-->
<!--          </FormControl>-->
<!--        </form>-->
<!--      </CardBody>-->
<!--    </Card>-->
<!--  </Flex>-->
<!--</template>-->

<style scoped></style>
