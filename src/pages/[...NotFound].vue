<template>
  <Flex col items-center justify-center class="h-full gap-2 text-center">
    <Text size="7xl">Not Found</Text>
    <Text size="4xl">Yo, that's a 404!</Text>
    <Text class="mt-5">We couldn't find that page. <br /></Text>
    <RouterLink to="/">
      <Button primary>Return to Home</Button>
    </RouterLink>
  </Flex>
</template>
