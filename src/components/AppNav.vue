<script setup lang="ts">
import Sidebar from '@/components/windowElements/sidebar.vue'
import MyRawSvg from '@/assets/logoTL.svg?raw'

const authStore = useAuthStore()
const router = useRouter()

const logout = async () => {
  await authStore.logout()
  router.push('/')
}

const useOrganizations = useOrganizationsStore()
</script>

<template>
  <Sidebar></Sidebar>
  <Navbar>
    <NavbarStart>
      <div class="px-20">
        <Button
          ghost
          @click="router.replace({ path: '/organisation' })"
          class="font-thin tracking-wider rounded-full"
        >
          <QueryAndShow :id="authStore.oid" :store="useOrganizations" />
        </Button>
      </div>
    </NavbarStart>

    <NavbarEnd>
      <div class="flex-col justify-items-center px-2">
        <div v-html="MyRawSvg"></div>
        <div class="text-xs font-thin antialiased text-gray-500">251121</div>
      </div>
    </NavbarEnd>
  </Navbar>
</template>
