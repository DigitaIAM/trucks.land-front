<script setup lang="ts">
import moment from 'moment-timezone'
import VueDatePicker from '@vuepic/vue-datepicker'

const userConditionsStore = useUserConditionsStore()
const accessMatrixStore = useAccessMatrixStore()

const props = defineProps<{
  org: Organization
  edit: User | null
}>()

const id = ref<number>()

const title = ref('')
const name = ref('')
const real_name = ref('')
const phone = ref('')
const email = ref('')
const team = ref('')
const percent_of_gross = ref<number | null>(null)
const percent_of_profit = ref<number | null>(null)
const fixed_salary = ref<number | null>(null)
const income_tax = ref<number | null>(null)
const fired = ref(false)
const fired_at = ref(new Date() as Date | undefined)
const performed_by = ref<number>()

const password = ref('')

const roleModel = reactive<{
  is_admin: boolean
  is_dispatcher: boolean
  is_tracking: boolean
  is_hr: boolean
  is_accountant: boolean
  is_payroll_accountant: boolean
}>({
  is_admin: false,
  is_dispatcher: false,
  is_tracking: false,
  is_hr: false,
  is_accountant: false,
  is_payroll_accountant: false,
})

const roles = [
  { key: 'is_admin', label: 'admin' },
  { key: 'is_dispatcher', label: 'dispatcher' },
  { key: 'is_tracking', label: 'tracking' },
  { key: 'is_hr', label: 'HR' },
  { key: 'is_accountant', label: 'accountant' },
  { key: 'is_payroll_accountant', label: 'payroll accountant' },
] as const

const emit = defineEmits(['closed'])

const usersStore = useUsersStore()
const authStore = useAuthStore()

const isNew = computed(() => id.value == null)
const canCreate = computed(() => authStore.account?.access.is_admin === true)

function openModal() {
  ;(document.getElementById('edit_user') as HTMLDialogElement | null)?.showModal()
}

function closeModal() {
  ;(document.getElementById('edit_user') as HTMLDialogElement | null)?.close()
}

watch(
  () => props.edit,
  (user) => resetAndShow(user),
  { deep: true },
)

const colorMode = useColorMode()

async function resetAndShow(user: User | null) {
  if (user === null) {
    closeModal()
    return
  }

  id.value = user?.id

  if (user?.id == null) {
    name.value = ''
    real_name.value = ''
    phone.value = ''
    email.value = ''
    team.value = ''
    password.value = ''
    for (const key of Object.keys(roleModel) as Array<keyof typeof roleModel>) {
      roleModel[key] = false
    }
    title.value = 'New user'
    openModal()
    return
  }

  name.value = user?.name || ''
  real_name.value = user?.real_name || ''
  phone.value = user?.phone || ''
  email.value = user?.email || ''

  const condition = await userConditionsStore.getCondition(props.org.id, user?.id)
  percent_of_gross.value = condition?.percent_of_gross
  percent_of_profit.value = condition?.percent_of_profit
  fixed_salary.value = condition?.fixed_salary
  income_tax.value = condition?.income_tax
  fired.value = user?.fired ?? true
  fired_at.value = user?.fired_at
  performed_by.value = user?.performed_by

  const access = await accessMatrixStore.getAccessMatrix(props.org.id, user?.id ?? null)

  team.value = access?.team?.toString() ?? ''

  let str = ''
  if (access?.is_admin) {
    str += 'admin, '
  }
  if (access?.is_dispatcher) {
    str += 'dispatcher, '
  }
  if (access?.is_tracking) {
    str += 'tracking, '
  }
  if (access?.is_hr) {
    str += 'HR, '
  }
  if (access?.is_accountant) {
    str += 'accountant, '
  }
  title.value = str.substring(0, str.length - 2)

  openModal()
}

async function saveUser() {
  try {
    if (id.value == null) {
      if (!canCreate.value) {
        alert('У вас нет прав на создание пользователей')
        return
      }
      if (!password.value) {
        alert('Укажите пароль для нового сотрудника')
        return
      }
      if (team.value && Number.isNaN(Number(team.value))) {
        alert('Team # должен быть числом')
        return
      }

      await usersStore.register({
        orgId: props.org.id,
        performedBy: authStore.account?.id,
        email: email.value,
        password: password.value,
        name: name.value,
        real_name: real_name.value,
        phone: phone.value,
        team: team.value,
        access: { ...roleModel },
      })

      alert('Сотрудник зарегистрирован')
    } else {
      const userData = {
        name: name.value,
        real_name: real_name.value,
        phone: phone.value,
        email: email.value,
        team: team.value ? Number(team.value) : null,
        fired: fired.value,
        fired_at: fired_at.value,
      }

      await usersStore.update(id.value, userData)
    }

    closeModal()
    emit('closed')
  } catch (e) {
    console.error('Ошибка при сохранении профиля:', e)
    alert((e as Error)?.message ?? 'Не удалось сохранить профиль')
  }
}

async function toggleEmployeeStatus() {
  if (!id.value) {
    alert('Сначала создайте пользователя (нажмите Create), чтобы оформить его как сотрудника')
    return
  }

  const account = await authStore.currentAccount()
  if (!account) return

  const isFiring = !fired.value

  const selectedDate = fired_at.value

  if (!selectedDate && !isFiring) {
    alert('Пожалуйста, выберите дату принятия на работу')
    return
  }

  try {
    await usersStore.update(id.value, {
      fired: isFiring,
      fired_at: moment(selectedDate).format('YYYY-MM-DD'),
    })

    const { error: historyError } = await supabase.from('employee_hiring_history').insert({
      user_id: id.value,
      action: isFiring ? 'fire' : 'hire',
      date_action: moment(selectedDate).tz('America/New_York').toISOString(),
      performed_by: account.id,
    })

    if (historyError) throw historyError

    fired.value = isFiring
    closeModal()
    emit('closed')

    alert(isFiring ? 'Сотрудник уволен' : 'Сотрудник успешно принят на работу')
  } catch (error) {
    console.error('Ошибка при выполнении действия:', error)
  }
}

function close() {
  closeModal()
  emit('closed')
}
</script>

<template>
  <div class="flex flex-row gap-6 px-4 mb-2 mt-3">
    <SearchVue :store="usersStore"></SearchVue>
    <Button
      v-if="canCreate"
      class="btn-soft font-light tracking-wider"
      @click="resetAndShow({} as User)"
      >Create</Button
    >
  </div>

  <Modal id="edit_user">
    <ModalBox class="w-4/5">
      <div class="flex items-start justify-between">
        <div>
          <Text class="mr-6" size="2xl">{{ title }}</Text>
        </div>
      </div>

      <div v-if="!isNew && fired_at" class="mt-2 text-sm font-medium">
        <div v-if="fired" class="text-red-600">
          Fired: {{ moment(fired_at).format('YYYY-MM-DD') }}
        </div>

        <div v-else class="text-green-600">Hired: {{ moment(fired_at).format('YYYY-MM-DD') }}</div>
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

      <div v-if="isNew && canCreate" class="flex space-x-3 mb-2 mt-4 w-full">
        <div class="md:w-1/2 md:mb-0">
          <Label>Password</Label>
          <TextInput type="password" v-model="password" />
        </div>
        <div class="md:w-1/2 md:mb-0">
          <Label>Team #</Label>
          <TextInput v-model="team" />
        </div>
      </div>

      <div v-if="isNew && canCreate" class="flex space-x-48 mb-4 mt-6 w-full">
        <Text size="2xl">Roles</Text>
      </div>

      <div v-if="isNew && canCreate" class="flex space-x-3 mb-2 mt-4 w-full flex-wrap gap-y-2">
        <label
          v-for="role in roles"
          :key="role.key"
          class="flex items-center gap-2 mr-6 cursor-pointer"
        >
          <input type="checkbox" v-model="roleModel[role.key]" class="checkbox checkbox-sm" />
          <Label>{{ role.label }}</Label>
        </label>
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

      <div class="flex space-x-3 mb-2 w-full">
        <div class="md:w-1/2 md:mb-0">
          <Label> Income tax %</Label>
          <TextInput disabled v-model="income_tax" />
        </div>
        <div v-if="!isNew && team" class="md:w-1/2 md:mb-0">
          <Label>Team #</Label>
          <TextInput v-model="team" disabled />
        </div>
      </div>

      <ModalAction>
        <div class="flex justify-between w-full">
          <VueDatePicker
            v-if="!isNew"
            class="my-custom-datepicker mr-3"
            teleport-center
            :enable-time-picker="false"
            v-model="fired_at"
            :dark="colorMode.preference == 'dark'"
          ></VueDatePicker>
          <Button
            v-if="!isNew"
            type="button"
            @click="toggleEmployeeStatus"
            :class="fired ? 'bg-green-600' : 'bg-red-600'"
            class="text-white mr-3"
          >
            {{ fired ? 'hire employee' : 'fire employee' }}
          </Button>
          <div v-else></div>
          <div class="flex gap-3">
            <Button @click="saveUser" class="btn-soft font-light tracking-wider">
              {{ isNew ? 'Create' : 'Update' }}
            </Button>

            <Button @click="close" class="btn-soft font-light tracking-wider"> Close </Button>
          </div>
        </div>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
