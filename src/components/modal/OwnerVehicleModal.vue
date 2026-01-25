<script setup lang="ts">
const authStore = useAuthStore()
const ownerVehicleStore = useOwnerVehicleStore()
const ownersStore = useOwnersStore()
const vehiclesStore = useVehiclesStore()

const props = defineProps<{
  edit: OwnerVehicle | null
}>()

const id = ref<number>()
const created_by = ref<User>()
const owner = ref<number>()
const vehicle = ref<number>()
const insurance = ref<number>()

const emit = defineEmits(['closed'])

watch(
  () => props.edit,
  (record) => {
    resetAndShow(record)
  },
  { deep: true },
)

function resetAndShow(record: OwnerVehicle | null) {
  const account = authStore.currentAccount()

  id.value = record?.id
  created_by.value = record ? { id: record.created_by } : account ? { id: account.id } : null
  owner.value = record ? { id: record.owner } : null
  vehicle.value = record ? { id: record.vehicle } : null
  insurance.value = record?.insurance

  record_modal.showModal()
}

function saveRecord() {
  if (id.value == null) {
    ownerVehicleStore.create({
      owner: owner.value?.id,
      vehicle: vehicle.value?.id,
      insurance: insurance.value,
    } as OwnerVehicleCreate)
  } else {
    ownerVehicleStore.update(id.value, {
      owner: owner.value?.id,
      vehicle: vehicle.value?.id,
      insurance: insurance.value,
    } as OwnerVehicleUpdate)
  }
  record_modal.showModal()
  emit('closed')
}
</script>

<template>
  <div class="flex flex-row gap-6 px-4 mb-2 mt-3">
    <Text size="2xl">Insurances</Text>
    <!--    <SearchVue :store=""></SearchVue>-->
    <Button class="btn-soft font-light tracking-wider" @click="resetAndShow(null)">Create</Button>
  </div>
  <Modal id="record_modal">
    <ModalBox class="w-2/5">
      <div>
        <Label class="mt-2 mb-2">Owner</Label>
        <selector v-model="owner" :store="ownersStore" />
      </div>
      <Label class="mb-2 mt-4">Unit Id</Label>
      <selector v-model="vehicle" :store="vehiclesStore" />

      <div class="md:w-1/2 md:mb-0">
        <Label class="mt-4 mb-2">Number of insurance</Label>
        <TextInput v-model="insurance" />
      </div>
      <ModalAction>
        <form method="dialog">
          <Button class="btn-soft font-light tracking-wider" @click="saveRecord()">
            <span v-if="id > 0">Update</span><span v-else>Create</span>
          </Button>
          <Button class="btn-soft font-light tracking-wider ml-6">Close</Button>
        </form>
      </ModalAction>
    </ModalBox>
  </Modal>
</template>

<style scoped></style>
