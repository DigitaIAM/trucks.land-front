<script setup lang="ts">
import type { Broker } from '@/stores/brokers.ts'
import SearchVue from '@/components/search/SearchVue.vue'

const props = defineProps<{
  edit: Broker | null
}>()

const id = ref<number>()
const name = ref('')
const person = ref('')
const phone = ref('')
const email = ref('')
const city = ref('')
const street = ref('')
const state = ref('')
const zip = ref('')
const ms = ref('')
const dot = ref('')
const is_active = ref(false)

const emit = defineEmits(['closed'])

watch(
  () => props.edit,
  (broker) => {
    resetAndShow(broker)
  },
  { deep: true },
)

const brokersStore = useBrokersStore()

function resetAndShow(broker: Broker | null) {
  id.value = broker?.id

  name.value = broker?.name || ''

  person.value = broker?.contact || ''
  email.value = broker?.email || ''
  phone.value = broker?.phone || ''

  street.value = broker?.street || ''
  city.value = broker?.city || ''
  zip.value = broker?.zip || ''
  state.value = broker?.state || ''

  dot.value = broker?.dot || ''
  ms.value = broker?.ms || ''

  is_active.value = broker?.is_active || false
  edit_broker.showModal()
}

function saveBroker() {
  if (id.value == null) {
    brokersStore.create({
      name: name.value,

      contact: person.value,
      email: email.value,
      phone: phone.value,

      street: street.value,
      city: city.value,
      zip: zip.value,
      state: state.value,

      dot: dot.value,
      ms: ms.value,

      is_active: is_active.value,
    } as BrokerCreate)
  } else {
    brokersStore.update(id.value, {
      name: name.value,

      contact: person.value,
      email: email.value,
      phone: phone.value,

      street: street.value,
      city: city.value,
      zip: zip.value,
      state: state.value,

      dot: dot.value,
      ms: ms.value,

      is_active: is_active.value,
    } as BrokerUpdate)
  }
  edit_broker.close()
  emit('closed')
}
</script>

<template>
  <div class="flex flex-row gap-6 px-4 mb-2 mt-3">
    <SearchVue :store="brokersStore"></SearchVue>
    <Button class="btn-soft font-light tracking-wider" @click="resetAndShow(null)">Create</Button>
  </div>

  <Modal id="edit_broker">
    <ModalBox class="w-2/5">
      <Text size="2xl">Broker</Text>

      <div class="flex space-x-5 mb-4 mt-2 w-full">
        <div class="md:w-3/4 md:mb-0">
          <Label>Name</Label>
          <TextInput v-model="name" />
        </div>
        <div class="md:w-1/4 md:mb-0 mt-8">
          <label class="label">
            <Toggle v-model="is_active"></Toggle>
            <span class="ml-3">active</span>
          </label>
        </div>
      </div>

      <Label>Person</Label>
      <TextInput class="w-full" v-model="person" />

      <div class="flex flex-wrap mb-2 mt-4 w-full">
        <div class="md:w-1/2 md:mb-0">
          <Label>City/town</Label>
          <TextInput v-model="city" />
        </div>
        <div class="md:w-1/4 px-3 md:mb-0">
          <Label>State</Label>
          <TextInput v-model="state" />
        </div>
        <div class="md:w-1/4 md:mb-0">
          <Label>ZIP</Label>
          <TextInput v-model="zip" />
        </div>
      </div>
      <div class="flex space-x-3 mb-2 mt-4 w-full">
        <div class="md:w-1/2 md:mb-0">
          <Label>Street</Label>
          <TextInput v-model="street" />
        </div>
        <div class="md:w-1/2 md:mb-0">
          <Label>Phone</Label>
          <TextInput type="phone" v-model="phone" />
        </div>
      </div>
      <div class="flex space-x-3 mb-2 mt-4 w-full">
        <div class="md:w-1/2 md:mb-0">
          <Label>Email</Label>
          <TextInput type="email" v-model="email" />
        </div>
        <div class="md:w-1/4 px-3 md:mb-0">
          <Label>MC</Label>
          <TextInput v-model="ms" />
        </div>
        <div class="md:w-1/4 md:mb-0">
          <Label>USDOT</Label>
          <TextInput v-model="dot" />
        </div>
      </div>
      <ModalAction>
        <form method="dialog">
          <Button @click="saveBroker()" class="btn-soft font-light tracking-wider">
            <span v-if="id > 0">Update</span><span v-else>Create</span>
          </Button>
          <Button class="btn-soft font-light tracking-wider ml-6">Close</Button>
        </form>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
