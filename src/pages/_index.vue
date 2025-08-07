<script setup lang="ts">
const colorMode = useColorMode()
const themes = useThemes()
const authStore = useAuthStore()
</script>

<template>
  <div class="transition-colors duration-300">
    <Hero class="h-[32rem] bg-base-300">
      <HeroContent>
        <Flex col center class="max-w-xl text-center gap-5">
          <Text is="h1" size="5xl" bold> Feathers-Pinia + Vite</Text>
          <Text xl> Welcome to the Perfect Single Page App Stack.</Text>
          <div>
            <RouterLink v-if="authStore.user" to="/app">
              <Button primary> Open App</Button>
            </RouterLink>
            <RouterLink v-else to="/login">
              <Button primary> Get Started</Button>
            </RouterLink>
          </div>
        </Flex>
      </HeroContent>
    </Hero>

    <Flex v-if="!authStore.user" items-center col class="py-8 gap-4">
      <Text>Try the login redirect while not logged in</Text>
      <RouterLink to="/app/me">
        <Button>Open the Profile Page</Button>
      </RouterLink>
    </Flex>

    <Card class="bg-base-200 mx-auto max-w-md text-center my-12">
      <CardBody class="gap-4">
        <Text size="3xl"> Set The Mood</Text>
        <Text size="lg">
          With
          <Link primary href="https://daisyui.com" target="blank" class="font-bold"> DaisyUI</Link>
          under the hood, you can <br />pick your favorite theme.
        </Text>

        <FormControl class="mx-auto w-60">
          <Select
            v-model="colorMode.preference"
            :options="themes"
            class="select select-bordered w-full max-w-xs"
          />
        </FormControl>
      </CardBody>
    </Card>
  </div>
</template>
