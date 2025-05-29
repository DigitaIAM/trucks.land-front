<script setup lang="ts">
import type { Owner } from '@/stores/owners.ts'

const props = defineProps<{
  edit: Owner | null
}>()

const id = ref<number>()

const name = ref('')
const ein = ref('')
const street = ref('')
const email = ref('')
const phone = ref('')
const city = ref('')
const state = ref('')
const zip = ref('')
const is_person = ref(false)
const is_active = ref(false)

const emit = defineEmits(['closed'])

watch(
  () => props.edit,
  (owner) => {
    resetAndShow(owner)
  },
  { deep: true },
)

const ownersStore = useOwnersStore()

function resetAndShow(owner: Owner | null) {
  id.value = owner?.id
  name.value = owner?.name || ''
  ein.value = owner?.ein || ''
  street.value = owner?.street || ''
  email.value = owner?.email || ''
  phone.value = owner?.phone || ''
  city.value = owner?.city || ''
  state.value = owner?.state || ''
  zip.value = owner?.zip || ''
  is_person.value = owner?.is_person || false
  is_active.value = owner?.is_active || false
  edit_owner.showModal()
}

function saveOwner() {
  if (id.value == null) {
    ownersStore.create({
      name: name.value,
      ein: ein.value,
      street: street.value,
      email: email.value,
      phone: phone.value,
      city: city.value,
      state: state.value,
      zip: zip.value,
      is_person: is_person.value,
      is_active: is_active.value,
    } as OwnerCreate)
  } else {
    ownersStore.update(id.value, {
      name: name.value,
      ein: ein.value,
      street: street.value,
      email: email.value,
      phone: phone.value,
      city: city.value,
      state: state.value,
      zip: zip.value,
      is_person: is_person.value,
      is_active: is_active.value,
    } as OwnerUpdate)
  }
  edit_owner.close()
  emit('closed')
}
</script>

<template>
  <div class="flex flex-row gap-6 px-4 mb-2 mt-3">
    <Search></Search>
    <Button class="btn" @click="resetAndShow(null)">Create</Button>
  </div>
  <Modal id="edit_owner">
    <ModalBox class="w-2/5">
      <Text size="2xl">Owner</Text>

      <div class="flex space-x-3 mb-2 mt-4 w-full">
        <TextInput class="md:w-3/5 md:mb-0" placeholder="Name" v-model="name" />
        <div>
          <label class="label">
            <Toggle v-model="is_active"></Toggle>
            <span class="ml-3">active</span>
          </label>
        </div>
      </div>
      <TextInput class="mt-2 w-full" placeholder="EIN" v-model="ein"></TextInput>
      <div class="flex space-x-3 mb-4 mt-4 w-full">
        <div class="md:w-1/2 md:mb-0">
          <TextInput placeholder="Email" v-model="email" />
        </div>
        <div class="md:w-1/2 md:mb-0">
          <TextInput placeholder="Phone" v-model="phone" />
        </div>
      </div>
      <label class="label">
        <Toggle v-model="is_person"></Toggle>
        <span class="ml-3">person</span>
      </label>
      <div class="flex space-x-3 mb-2 mt-4 w-full">
        <div class="md:w-1/2 md:mb-0">
          <TextInput placeholder="Street" v-model="street" />
        </div>
        <div class="md:w-1/2 md:mb-0">
          <TextInput placeholder="City / town" v-model="city" />
        </div>
      </div>
      <div class="flex space-x-3 mb-2 mt-4 w-full">
        <div class="md:w-1/3 md:mb-0">
          <TextInput placeholder="State" v-model="state" />
        </div>
        <div class="md:w-1/3 md:mb-0">
          <TextInput placeholder="Zip" v-model="zip" />
        </div>
      </div>

      <ModalAction>
        <form method="dialog">
          <Button @click="saveOwner()">
            <span v-if="id > 0">Update</span><span v-else>Create</span>
          </Button>
          <Button class="ml-6">Close</Button>
        </form>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
