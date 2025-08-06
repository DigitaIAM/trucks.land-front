<script setup lang="ts">
// import Logo from '~icons/logos/feathersjs'
// import UserIcon from '~icons/feather/user'
// import ChevronDownIcon from '~icons/feather/chevron-down'
// import LoginIcon from '~icons/feather/log-in'

import LoginIcon from 'virtual:icons/mdi/store-24-hour'
import Sidebar from '@/components/windowElements/sidebar.vue'

const authStore = useAuthStore()
const router = useRouter()

const logout = async () => {
  await authStore.logout()
  router.push('/')
}

const colorMode = useColorMode()
const themes = useThemes()
const useOrganizations = useOrganizationsStore()
</script>

<template>
  <Sidebar></Sidebar>
  <Navbar>
    <NavbarStart>
      <FormControl class="px-24 mt-2">
        <!--        v-model="authStore.oid"-->
        <Select
          :modelValue="authStore.oid"
          @update:modelValue="
            async (oid) => {
              const org = await useOrganizations.resolve(oid)
              authStore.org = org
              router.replace({ path: '/' + org.code3.toLowerCase() + '/order/all' })
            }
          "
          :options="useOrganizations.listing"
          class="select-ghost select-lg w-full max-w-xs"
        />
      </FormControl>
    </NavbarStart>

    <NavbarEnd>
      <div class="px-4">
        <img src="./../assets/logoTL.svg" />
      </div>
      <!--      <FormControl class="mx-auto">-->
      <!--        <Select v-model="colorMode.preference" :options="themes" class="select w-full max-w-xs" />-->
      <!--      </FormControl>-->

      <!--      <Dropdown end v-if="authStore.user">-->
      <!--        <Button circle class="relative">-->
      <!--          <img-->
      <!--            class="object-cover w-8 h-8 rounded-full"-->
      <!--            src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=faceare&facepad=3&w=688&h=688&q=100"-->
      <!--            alt=""-->
      <!--          />-->
      <!--        </Button>-->
      <!--        <DropdownContent>-->
      <!--          <Menu class="bg-base-300 shadow-lg rounded-lg whitespace-nowrap">-->
      <!--            <MenuItem>-->
      <!--              <RouterLink to="/app/me">My Account</RouterLink>-->
      <!--            </MenuItem>-->
      <!--            <MenuItem>-->
      <!--              <a href="javascript://" @click="logout">Logout</a>-->
      <!--            </MenuItem>-->
      <!--          </Menu>-->
      <!--        </DropdownContent>-->
      <!--      </Dropdown>-->

      <!--      <RouterLink v-else to="/login">-->
      <!--        <Tooltip bottom tip="Login">-->
      <!--          <Button circle>-->
      <!--            <LoginIcon />-->
      <!--          </Button>-->
      <!--        </Tooltip>-->
      <!--      </RouterLink>-->
    </NavbarEnd>
  </Navbar>
</template>
