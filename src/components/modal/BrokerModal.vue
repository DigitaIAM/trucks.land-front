<script setup lang="ts">
import ToggleDescription from '@/components/buttons/ToggleDescription.vue'
import type { Broker } from '@/stores/brokers.ts'

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

const emit = defineEmits(['closed'])

watch(
  () => props.edit,
  (broker) => {
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

    edit_broker.showModal()
  },
  { deep: true },
)

const brokersStore = useBrokersStore()

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
    } as BrokerUpdate)
  }
  edit_broker.close()
  emit('closed')
}
</script>

<template>
  <div class="flex flex-row gap-6 px-4 mb-2 mt-3">
    <Search></Search>
    <Button class="btn" onclick="edit_broker.showModal()">Create</Button>
  </div>

  <Modal id="edit_broker">
    <ModalBox class="w-2/5">
      <Text size="2xl">Broker</Text>

      <div class="flex mb-4 mt-4 w-full">
        <div class="md:w-3/5 md:mb-0">
          <TextInput placeholder="Name" v-model="name" />
        </div>
        <div class="md:w-1/5 px-4 md:mb-0">
          <ToggleDescription label="active"></ToggleDescription>
        </div>
      </div>
      <div class="mb-2 mt-6 md:mb-0">
        <TextInput placeholder="Person" v-model="person" />
      </div>
      <div class="flex flex-wrap mb-2 mt-6 w-full">
        <div class="md:w-1/2 md:mb-0">
          <TextInput placeholder="City/town" v-model="city" />
        </div>
        <div class="md:w-1/4 px-3 md:mb-0">
          <TextInput placeholder="State" v-model="state" />
        </div>
        <div class="md:w-1/4 md:mb-0">
          <TextInput placeholder="ZIP" v-model="zip" />
        </div>
      </div>
      <div class="flex space-x-3 mb-2 mt-6 w-full">
        <div class="md:w-1/2 md:mb-0">
          <TextInput placeholder="Street" v-model="street" />
        </div>
        <div class="md:w-1/2 md:mb-0">
          <TextInput placeholder="Phone" v-model="phone" />
        </div>
      </div>
      <div class="flex flex-wrap mb-6 mt-6 w-full">
        <div class="md:w-1/2 md:mb-0">
          <TextInput placeholder="Email" v-model="email" />
        </div>
        <div class="md:w-1/4 px-3 md:mb-0">
          <TextInput placeholder="MS" v-model="ms" />
        </div>
        <div class="md:w-1/4 md:mb-0">
          <TextInput placeholder="DOT" v-model="dot" />
        </div>
      </div>
      <ModalAction>
        <form method="dialog">
          <Button @click="saveBroker()">Create</Button>
          <Button class="ml-6">Close</Button>
        </form>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
