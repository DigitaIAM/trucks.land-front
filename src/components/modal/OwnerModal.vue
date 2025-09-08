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
    <SearchVue :store="ownersStore"></SearchVue>
    <Button class="btn-soft font-light tracking-wider" @click="resetAndShow(null)">Create</Button>
  </div>
  <Modal id="edit_owner">
    <ModalBox class="w-2/5">
      <Text size="2xl">Owner</Text>

      <div class="flex space-x-5 mb-2 mt-2 w-full">
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

      <Label class="mt-2">EIN</Label>
      <TextInput class="w-full" v-model="ein"></TextInput>
      <div class="flex space-x-3 mb-4 mt-4 w-full">
        <div class="md:w-1/2 md:mb-0">
          <Label>Email</Label>
          <TextInput type="email" v-model="email" />
        </div>
        <div class="md:w-1/2 md:mb-0">
          <Label>Phone</Label>
          <TextInput type="phone" v-model="phone" />
        </div>
      </div>
      <label class="label">
        <Toggle v-model="is_person"></Toggle>
        <span class="ml-3">person</span>
      </label>

      <div class="flex space-x-3 mb-2 mt-4 w-full">
        <div class="md:w-1/2 md:mb-0">
          <Label>City/town</Label>
          <TextInput v-model="city" />
        </div>
        <div class="md:w-1/2 md:mb-0">
          <Label>Street</Label>
          <TextInput v-model="street" />
        </div>
      </div>
      <div class="flex space-x-3 mb-2 mt-4 w-full">
        <div class="md:w-1/2 md:mb-0">
          <Label>State</Label>
          <TextInput v-model="state" />
        </div>
        <div class="md:w-1/2 md:mb-0">
          <Label>ZIP</Label>
          <TextInput v-model="zip" />
        </div>
      </div>

      <ModalAction>
        <form method="dialog">
          <Button @click="saveOwner()" class="btn-soft font-light tracking-wider">
            <span v-if="id > 0">Update</span><span v-else>Create</span>
          </Button>
          <Button class="btn-soft font-light tracking-wider ml-6">Close</Button>
        </form>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
