<script setup lang="ts">
const organizations = useOrganizationsStore()

const props = defineProps<{
  edit: User | null
}>()

const id = ref<number>()

const name = ref('')
const real_name = ref('')

const phone = ref('')
const email = ref('')

const group = ref('')

const organization = ref(null)

const less_ten = ref<number>()
const more_ten = ref<number>()
const percent = ref<number>()

const admin = ref(false)
const manager = ref(false)
const dispatcher_supervisor = ref(false)
const dispatcher = ref(false)
const tracking_supervisor = ref(false)
const tracking_team = ref(false)
const accounts = ref(false)
const hr = ref(false)
const broker = ref(false)
const view = ref(false)
const driver = ref(false)

const disabled = ref(false)

const emit = defineEmits(['closed'])

watch(
  () => props.edit,
  (user) => {
    resetAndShow(user)
  },
  { deep: true },
)

const usersStore = useUsersStore()

function resetAndShow(user: User | null) {
  id.value = user?.id

  name.value = user?.name || ''
  real_name.value = user?.real_name || ''
  phone.value = user?.phone || ''
  email.value = user?.email || ''
  group.value = user?.group || ''

  organization.value = user ? { id: user.organization } : null
  less_ten.value = user?.less_ten
  more_ten.value = user?.more_ten
  percent.value = user?.percent

  admin.value = user?.admin || false
  manager.value = user?.manager || false
  dispatcher_supervisor.value = user?.dispatcher_supervisor || false
  dispatcher.value = user?.dispatcher || false
  tracking_supervisor.value = user?.tracking_supervisor || false
  tracking_team.value = user?.tracking_team || false
  accounts.value = user?.accounts || false
  hr.value = user?.hr || false
  broker.value = user?.broker || false
  view.value = user?.view || false
  driver.value = user?.driver || false
  disabled.value = user?.disabled || false

  edit_user.showModal()
}

function saveUser() {
  try {
    if (id.value == null) {
      usersStore.create({
        name: name.value,
        real_name: real_name.value,
        phone: phone.value,
        email: email.value,
        group: group.value,

        organization: organization.value?.id,
        less_ten: less_ten.value,
        more_ten: more_ten.value,
        percent: percent.value,

        admin: admin.value,
        manager: manager.value,
        dispatcher_supervisor: dispatcher_supervisor.value,
        dispatcher: dispatcher.value,
        tracking_supervisor: tracking_supervisor.value,
        tracking_team: tracking_team.value,
        accounts: accounts.value,
        hr: hr.value,
        broker: broker.value,
        view: view.value,
        driver: driver.value,
        disabled: disabled.value,
      } as UserCreate)
    } else {
      usersStore.update(id.value, {
        name: name.value,
        real_name: real_name.value,
        phone: phone.value,
        email: email.value,
        group: group.value,

        organization: organization.value?.id,
        less_ten: less_ten.value,
        more_ten: more_ten.value,
        percent: percent.value,

        admin: admin.value,
        manager: manager.value,
        dispatcher_supervisor: dispatcher_supervisor.value,
        dispatcher: dispatcher.value,
        tracking_supervisor: tracking_supervisor.value,
        tracking_team: tracking_team.value,
        accounts: accounts.value,
        hr: hr.value,
        broker: broker.value,
        view: view.value,
        driver: driver.value,
        disabled: disabled.value,
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
        <label class="label">
          <Toggle v-model="disabled"></Toggle>
          <span class="ml-1 mr-3">disabled</span>
        </label>
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

      <!--      <TextInput-->
      <!--        type="password"-->
      <!--        placeholder="Password"-->
      <!--        class="mt-2 mb-2 w-full"-->
      <!--        v-model="password"-->
      <!--      ></TextInput>-->

      <div class="flex space-x-3 mb-4 mt-4 w-full">
        <div class="md:w-1/4 md:mb-0">
          <Label>Group</Label>
          <TextInput v-model="group" />
        </div>
        <div class="md:w-3/4 md:mb-0">
          <Label>Organization</Label>
          <selector v-model="organization" :store="organizations"></selector>
        </div>
      </div>

      <div class="flex space-x-48 mb-2 mt-4 w-full">
        <h5>Vehicle dispatcher</h5>
        <h5>Goods dispatcher</h5>
      </div>

      <div class="flex space-x-3 mb-4 mt-2 w-full">
        <div class="md:w-1/3 md:mb-0">
          <Label><=10%</Label>
          <TextInput v-model="less_ten" />
        </div>
        <div class="md:w-1/3 md:mb-0">
          <Label> >10% </Label>
          <TextInput v-model="more_ten" />
        </div>
        <div class="md:w-1/3 md:mb-0">
          <Label> % </Label>
          <TextInput v-model="percent" />
        </div>
      </div>

      <div class="flex flex-row space-x-20">
        <div class="flex space-x-3 mt-2 w-full">
          <div class="md:w-1/2 md:mb-0">
            <label class="label mb-2">
              <Toggle v-model="admin"></Toggle>
              <span class="ml-3 mr-3">Admin</span>
            </label>
            <label class="label mb-2">
              <Toggle v-model="manager"></Toggle>
              <span class="ml-3">Organization manager</span>
            </label>
            <label class="label mb-2">
              <Toggle v-model="dispatcher_supervisor"></Toggle>
              <span class="ml-3">Dispatcher supervisor</span>
            </label>
            <label class="label mb-2">
              <Toggle v-model="dispatcher"></Toggle>
              <span class="ml-3">Dispatcher</span>
            </label>
            <label class="label mb-2">
              <Toggle v-model="tracking_supervisor"></Toggle>
              <span class="ml-3">Tracking team supervisor</span>
            </label>
            <label class="label mb-2">
              <Toggle v-model="tracking_team"></Toggle>
              <span class="ml-3">Tracking team</span>
            </label>
          </div>
        </div>

        <div class="flex space-x-3 mt-2 w-full">
          <div class="md:w-1/2 md:mb-0">
            <label class="label mb-2">
              <Toggle v-model="accounts"></Toggle>
              <span class="ml-3 mr-6">Accounts</span>
            </label>
            <label class="label mb-2">
              <Toggle v-model="hr"></Toggle>
              <span class="ml-3 mr-10">HR</span>
            </label>
            <label class="label mb-2">
              <Toggle v-model="view"></Toggle>
              <span class="ml-3 mr-6">View</span>
            </label>
            <label class="label mb-2">
              <Toggle v-model="driver"></Toggle>
              <span class="ml-3 mr-6">Driver</span>
            </label>
            <label class="label mb-2">
              <Toggle v-model="broker"></Toggle>
              <span class="ml-3 mr-6">Broker</span>
            </label>
          </div>
        </div>
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
