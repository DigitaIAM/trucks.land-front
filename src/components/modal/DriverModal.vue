<script setup lang="ts">
import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import type { Driver, DriverCreate, DriverUpdate } from '@/stores/drivers.ts'

const props = defineProps<{
  edit: Driver | null
}>()

const id = ref<number>()

const name = ref('')
const user = ref('')
const email = ref('')
const phone = ref('')
const licence = ref('')
const company = ref('')
const fix_payments = ref('')
const percentage = ref('')
const expiry_date = ref(new Date() as Date | undefined)

const emit = defineEmits(['closed'])

watch(
  () => props.edit,
  (driver) => {
    resetAndShow(driver)
  },
  { deep: true },
)

const driversStore = useDriversStore()

function resetAndShow(driver: Driver | null) {
  id.value = driver?.id
  name.value = driver?.name || ''
  user.value = driver?.user || ''
  email.value = driver?.email || ''
  phone.value = driver?.phone || ''
  licence.value = driver?.licence || ''
  company.value = driver?.company || ''
  fix_payments.value = driver?.fix_payments || ''
  percentage.value = driver?.percentage || ''
  expiry_date.value = driver?.expiry_date
  edit_driver.showModal()
}

function saveDriver() {
  if (id.value == null) {
    driversStore.create({
      name: name.value,

      user: user.value,
      email: email.value,
      phone: phone.value,

      licence: licence.value,
      company: company.value,
      fix_payments: fix_payments.value,
      percentage: percentage.value,

      expiry_date: expiry_date.value,
    } as DriverCreate)
  } else {
    driversStore.update(id.value, {
      name: name.value,

      user: user.value,
      email: email.value,
      phone: phone.value,

      licence: licence.value,
      company: company.value,
      fix_payments: fix_payments.value,
      percentage: percentage.value,

      expiry_date: expiry_date.value,
    } as DriverUpdate)
  }
  edit_driver.close()
  emit('closed')
}
</script>

<template>
  <div class="flex flex-row gap-6 px-4 mb-2 mt-3">
    <Search></Search>
    <Button class="btn" @click="resetAndShow(null)">Create</Button>
  </div>
  <Modal id="edit_driver">
    <ModalBox class="w-2/5">
      <Text size="2xl">Driver</Text>

      <div class="flex space-x-3 mb-2 mt-2 w-full">
        <div class="md:w-1/2 md:mb-0">
          <Label>Name</Label>
          <TextInput v-model="name" />
        </div>
        <div class="md:w-1/2 md:mb-0">
          <Label>User</Label>
          <TextInput v-model="user" />
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
      <div class="flex space-x-3 mb-4 mt-4 w-full">
        <div class="md:w-1/2 md:mb-0">
          <Label>Driver licence</Label>
          <TextInput v-model="licence" />
        </div>
        <div class="md:w-1/2 md:mb-0">
          <Label>Expiry date</Label>
          <VueDatePicker
            teleport-center
            :enable-time-picker="false"
            v-model="expiry_date"
          ></VueDatePicker>
        </div>
      </div>

      <Label>Company</Label>
      <TextInput class="w-full" v-model="company" />

      <div class="flex space-x-3 mb-6 mt-6 w-full">
        <div class="md:w-1/2 md:mb-0">
          <Label>Weekly fix payments</Label>
          <TextInput v-model="fix_payments" />
        </div>
        <div class="md:w-1/2 md:mb-0">
          <Label>Profit percentage</Label>
          <TextInput v-model="percentage" />
        </div>
      </div>
      <ModalAction>
        <form method="dialog">
          <Button @click="saveDriver()">
            <span v-if="id > 0">Update</span><span v-else>Create</span>
          </Button>
          <Button class="ml-6">Close</Button>
        </form>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
