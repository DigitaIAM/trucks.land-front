<script setup lang="ts">
const authStore = useAuthStore()
const router = useRouter()

const handleLogout = async () => {
  await authStore.logout()
  router.push('/')
}
</script>

<template>
  <div class="transition-colors duration-300">
    <Flex col items-center justify-center class="h-[32rem] gap-2 text-center">
      <Text size="7xl">App Home</Text>
      <Text size="4xl">You have arrived!</Text>
      <Text class="mt-5">You logged in like a boss.</Text>
      <div>
        <Button primary @click.prevent="handleLogout">Logout</Button>
        <RouterLink to="/">
          <Button>Return to Home</Button>
        </RouterLink>
      </div>
    </Flex>
  </div>
</template>
