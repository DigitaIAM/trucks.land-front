<script setup lang="ts">
// import Logo from '~icons/logos/feathersjs'
// import UserIcon from '~icons/feather/user'
// import ChevronDownIcon from '~icons/feather/chevron-down'
// import LoginIcon from '~icons/feather/log-in'

import Logo from 'virtual:icons/mdi/store-24-hour'
import UserIcon from 'virtual:icons/mdi/store-24-hour'
import ChevronDownIcon from 'virtual:icons/mdi/store-24-hour'
import LoginIcon from 'virtual:icons/mdi/store-24-hour'

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
  <Navbar class="bg-neutral/30">
    <NavbarStart>
      <RouterLink to="/" class="flex flex-row gap-2 items-center">
        <Logo class="text-2xl bg-white rounded-full" />
        <Text size="xl">Trucks.land</Text>
      </RouterLink>
    </NavbarStart>

    <NavbarCenter>
      <FormControl class="mx-auto w-60">
        <Select
          v-model="colorMode.preference"
          :options="themes"
          class="select select-bordered w-full max-w-xs"
        />
      </FormControl>
    </NavbarCenter>

    <NavbarEnd>
      <Dropdown end v-if="authStore.user">
        <Button circle class="relative">
          <UserIcon class="text-xl" />
          <ChevronDownIcon class="absolute right-1 text-[9px]" />
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
