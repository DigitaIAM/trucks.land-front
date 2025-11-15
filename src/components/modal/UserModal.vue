<script lang="ts">
import { defineBasicLoader } from 'unplugin-vue-router/data-loaders/basic'
import type { KV } from '@/utils/kv.ts'
import { useUserConditionsStore } from '@/stores/user_conditions.ts'

const organizationsStore = useOrganizationsStore()
const authStore = useAuthStore()
const userConditionsStore = useUserConditionsStore()

export const useOrgData = defineBasicLoader(
  'oid',
  async (route) => {
    const org = await organizationsStore.resolve3(route.params.oid)
    authStore.org = org
    await userConditionsStore.setContext({ orgId: org.id })
    // console.table(org)
    return org
  },
  { key: 'org' }
)
</script>

<script setup lang="ts">
import { useUserConditionsStore } from '@/stores/user_conditions.ts'

defineOptions({
  __loaders: [useOrgData]
})

const orgData = useOrgData()

const userConditionsStore = useUserConditionsStore()

const props = defineProps<{
  edit: User | null
}>()

const id = ref<number>()

const name = ref('')
const real_name = ref('')
const phone = ref('')
const email = ref('')
const percent_of_gross = ref<number | null>(null)
const percent_of_profit = ref<number | null>(null)
const fixed_salary = ref<number | null>(null)
const income_tax = ref<number | null>(null)


const emit = defineEmits(['closed'])

watch(
  () => props.edit,
  (user) => {
    resetAndShow(user)
  },
  { deep: true }
)

const usersStore = useUsersStore()

async function resetAndShow(user: User | null) {
  id.value = user?.id

  name.value = user?.name || ''
  real_name.value = user?.real_name || ''
  phone.value = user?.phone || ''
  email.value = user?.email || ''

  const condition = await userConditionsStore.setContext({ userId: user?.id })
  percent_of_gross.value = condition?.percent_of_gross
  percent_of_profit.value = condition?.percent_of_profit
  fixed_salary.value = condition?.fixed_salary
  income_tax.value = condition?.income_tax

  edit_user.showModal()
}

function saveUser() {
  try {
    if (id.value == null) {
      usersStore.create({
        name: name.value,
        real_name: real_name.value,
        phone: phone.value,
        email: email.value
        // percent_of_gross: percent_of_gross.value,
        // percent_of_profit: percent_of_profit.value
        // fixed_salary.value

      } as UserCreate)
    } else {
      usersStore.update(id.value, {
        name: name.value,
        real_name: real_name.value,
        phone: phone.value,
        email: email.value
        // percent_of_gross: percent_of_gross.value,
        // percent_of_profit: percent_of_profit.value
        // fixed_salary.value

      } as UserUpdate)
    }
    edit_user.close()
    emit('closed')
  } catch (e) {
    console.log('error', e)
  }
}
</script>

<template>
  <div class="flex flex-row gap-6 px-4 mb-2 mt-3">
    <SearchVue :store="usersStore"></SearchVue>
    <Button class="btn-soft font-light tracking-wider" @click="resetAndShow(null)">Create</Button>
  </div>

  <Modal id="edit_user">
    <ModalBox class="w-4/5">
      <div class="flex space-x-76 w-full">
        <Text size="2xl">User</Text>
      </div>

      <div class="flex space-x-5 mb-4 mt-4 w-full">
        <div class="md:w-1/2 md:mb-0">
          <Label>Name</Label>
          <TextInput v-model="name" />
        </div>
        <div class="md:w-1/2 md:mb-0">
          <Label>Real name</Label>
          <TextInput v-model="real_name" />
        </div>
      </div>
      <div class="flex space-x-3 mb-2 mt-4 w-full">
        <div class="md:w-1/2 md:mb-0">
          <Label>Email</Label>
          <TextInput type="email" v-model="email" />
        </div>
        <div class="md:w-1/2 md:mb-0">
          <Label>Phone</Label>
          <TextInput type="phone" v-model="phone" />
        </div>
      </div>

      <div class="flex space-x-48 mb-4 mt-6 w-full">
        <Text size="2xl">Сonditions</Text>
      </div>

      <div class="flex space-x-3 mt-4 w-full">
        <div class="md:w-1/3 md:mb-0">
          <Label> % of gross</Label>
          <TextInput disabled v-model="percent_of_gross" />
        </div>
        <Text class="py-8">or</Text>
        <div class="md:w-1/3 md:mb-0">
          <Label> % of profit</Label>
          <TextInput disabled v-model="percent_of_profit" />
        </div>
        <Text class="py-8">or</Text>
        <div class="md:w-1/3 md:mb-0">
          <Label> fixed salary $</Label>
          <TextInput disabled v-model="fixed_salary" />
        </div>
      </div>

      <div class="md:w-1/2 md:mb-0">
        <Label> Income tax %</Label>
        <TextInput disabled v-model="income_tax" />
      </div>

      <ModalAction>
        <form method="dialog">
          <Button @click="saveUser()" class="btn-soft font-light tracking-wider">
            <span v-if="id > 0">Update</span><span v-else>Create</span>
          </Button>
          <Button class="btn-soft font-light tracking-wider ml-6">Close</Button>
        </form>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
