<script setup lang="ts">
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
      <div class="px-4">
        <img src="./../assets/logoTL.svg" />
      </div>
    </NavbarEnd>
  </Navbar>
</template>
