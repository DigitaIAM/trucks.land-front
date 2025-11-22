<script setup lang="ts">
import MyRawSvg from '@/assets/logoTL.svg?raw'

const authStore = useAuthStore()
const useOrganizations = useOrganizationsStore()
</script>

<template>
  <Navbar>
    <NavbarStart>
      <div class="ml-6">
        <QueryAndShow :id="authStore.oid" :store="useOrganizations" />
      </div>
    </NavbarStart>

    <NavbarEnd>
      <div class="flex-col justify-items-center px-2">
        <div v-html="MyRawSvg"></div>
      </div>
    </NavbarEnd>
  </Navbar>
</template>
