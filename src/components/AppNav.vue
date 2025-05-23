<script setup lang="ts">
// import Logo from '~icons/logos/feathersjs'
// import UserIcon from '~icons/feather/user'
// import ChevronDownIcon from '~icons/feather/chevron-down'
// import LoginIcon from '~icons/feather/log-in'

import LoginIcon from 'virtual:icons/mdi/store-24-hour'
import Sidebar from '@/components/widgets/Sidebar.vue'

const authStore = useAuthStore()
const router = useRouter()

const logout = async () => {
  await authStore.logout()
  router.push('/')
}

const colorMode = useColorMode()
const themes = useThemes()
</script>

<template>
  <Navbar>
    <NavbarStart>
      <Sidebar></Sidebar>
    </NavbarStart>

    <NavbarCenter>
      <RouterLink to="/" class="flex flex-row gap-2 items-center">
        <img src="./../assets/logoTL.svg" />
        <Text size="xl">Trucks.land</Text>
      </RouterLink>
    </NavbarCenter>

    <NavbarEnd>
      <FormControl class="mx-auto w-60">
        <Select v-model="colorMode.preference" :options="themes" class="select w-full max-w-xs" />
      </FormControl>

      <Dropdown end v-if="authStore.user">
        <Button circle class="relative">
          <img
            class="object-cover w-8 h-8 rounded-full"
            src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=faceare&facepad=3&w=688&h=688&q=100"
            alt=""
          />
        </Button>
        <DropdownContent>
          <Menu class="bg-base-300 shadow-lg rounded-lg whitespace-nowrap">
            <MenuItem>
              <RouterLink to="/app/me">My Account</RouterLink>
            </MenuItem>
            <MenuItem>
              <a href="javascript://" @click="logout">Logout</a>
            </MenuItem>
          </Menu>
        </DropdownContent>
      </Dropdown>

      <RouterLink v-else to="/login">
        <Tooltip bottom tip="Login">
          <Button circle>
            <LoginIcon />
          </Button>
        </Tooltip>
      </RouterLink>
    </NavbarEnd>
  </Navbar>
</template>
