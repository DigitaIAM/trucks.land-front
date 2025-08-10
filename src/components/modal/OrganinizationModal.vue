<script setup lang="ts">
const owners = useOwnersStore()

const props = defineProps<{
  edit: Organization | null
}>()

const id = ref<number>()

const code2 = ref('')
const code3 = ref('')
const address1 = ref('')
const address2 = ref('')
const name = ref('')
const billing_email = ref('')
const owner = ref(null)

const emit = defineEmits(['closed'])

watch(
  () => props.edit,
  (organization) => {
    resetAndShow(organization)
  },
  { deep: true },
)

const organizationStore = useOrganizationsStore()

function resetAndShow(organization: Organization | null) {
  id.value = organization?.id

  name.value = organization?.name || ''
  code2.value = organization?.code2 || ''
  code3.value = organization?.code3 || ''
  address1.value = organization?.address1 || ''
  address2.value = organization?.address2 || ''
  billing_email.value = organization?.billing_email || ''

  owner.value = organization ? { id: organization.owner } : null

  edit_organization.showModal()
}

function saveOrganization() {
  try {
    if (id.value == null) {
      organizationStore.create({
        code2: code2.value,
        code3: code3.value,
        address2: address2.value,
        address1: address1.value,
        name: name.value,
        billing_email: billing_email.value,

        owner: owner.value?.id,
      } as OrganizationCreate)
    } else {
      organizationStore.update(id.value, {
        code2: code2.value,
        code3: code3.value,
        address2: address2.value,
        address1: address1.value,
        name: name.value,
        billing_email: billing_email.value,

        owner: owner.value?.id,
      } as OrganizationUpdate)
    }
    edit_organization.close()
    emit('closed')
  } catch (e) {
    console.log('error', e)
  }
}
</script>

<template>
  <div class="place-self-end px-3 mb-2 mt-3">
    <Button class="btn-soft font-light tracking-wider" @click="resetAndShow(null)">Create</Button>
  </div>
  <Modal id="edit_organization">
    <ModalBox class="w-2/5">
      <Text size="2xl">Organization</Text>

      <div class="flex space-x-3 mb-4 mt-4 w-full">
        <div class="md:w-1/2 md:mb-0">
          <Label>Code2</Label>
          <TextInput v-model="code2" />
        </div>
        <div class="md:w-1/2 md:mb-0">
          <Label>Address1</Label>
          <TextInput v-model="address1" />
        </div>
      </div>

      <div class="flex space-x-3 mb-4 mt-4 w-full">
        <div class="md:w-1/2 md:mb-0">
          <Label>Code3</Label>
          <TextInput v-model="code3" />
        </div>
        <div class="md:w-1/2 md:mb-0">
          <Label>Address2</Label>
          <TextInput v-model="address2" />
        </div>
      </div>
      <Label>Name</Label>
      <TextInput v-model="name" class="w-full mb-4"></TextInput>
      <Label>Billing email</Label>
      <TextInput type="email" v-model="billing_email" class="w-full mb-4"></TextInput>
      <Label>Owner</Label>
      <selector v-model="owner" :store="owners"></selector>
      <ModalAction>
        <form method="dialog">
          <Button @click="saveOrganization" class="btn-soft font-light tracking-wider">
            <span v-if="id > 0">Update</span><span v-else>Create</span>
          </Button>
          <Button class="btn-soft font-light tracking-wider ml-6">Close</Button>
        </form>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
